"""
Cloud Indicators and Region Identification Module
=================================================
Identifies cloud infrastructure markers (AWS, Cloudflare, GCP, Azure) and assesses
geographic hosting indicators. Strictly bounds regional reporting to verified evidence.
"""

from dataclasses import dataclass
import logging
import re
from typing import Any, Dict, List, Optional

logger = logging.getLogger("DefensiveAudit.CloudIndicators")

# Common CloudFront airport 3-letter IATA codes to geographic descriptions
POP_IATA_MAP = {
    "IAD": ("Northern Virginia / Washington DC, USA", "us-east-1"),
    "DCA": ("Washington DC, USA", "us-east-1"),
    "JFK": ("New York, NY, USA", "us-east-1"),
    "EWR": ("Newark, NJ, USA", "us-east-1"),
    "ORD": ("Chicago, IL, USA", "us-east-2"),
    "DFW": ("Dallas/Fort Worth, TX, USA", "us-east-2"),
    "SFO": ("San Francisco, CA, USA", "us-west-1"),
    "SJC": ("San Jose, CA, USA", "us-west-1"),
    "SEA": ("Seattle, WA, USA", "us-west-2"),
    "PDX": ("Portland, OR, USA", "us-west-2"),
    "LHR": ("London, United Kingdom", "eu-west-2"),
    "FRA": ("Frankfurt, Germany", "eu-central-1"),
    "CDG": ("Paris, France", "eu-west-3"),
    "AMS": ("Amsterdam, Netherlands", "eu-west-1"),
    "DUB": ("Dublin, Ireland", "eu-west-1"),
    "NRT": ("Tokyo Narita, Japan", "ap-northeast-1"),
    "HND": ("Tokyo Haneda, Japan", "ap-northeast-1"),
    "SIN": ("Singapore", "ap-southeast-1"),
    "SYD": ("Sydney, Australia", "ap-southeast-2"),
    "BOM": ("Mumbai, India", "ap-south-1"),
    "DEL": ("Delhi, India", "ap-south-1"),
}


@dataclass
class CloudFinding:
    provider: str
    service: str
    evidence: str
    region: Optional[str]
    region_confidence: str  # CONFIRMED, HEURISTIC_EDGE_ONLY, UNVERIFIED
    details: str


class CloudIndicatorAnalyzer:
    """Detects cloud hosting indicators and assesses origin/edge region reliability."""

    def __init__(self, headers: Dict[str, str], dns_cnames: List[str], resolved_ips: Optional[List[str]] = None):
        self.headers = {k.lower(): v for k, v in headers.items()}
        self.cnames = [c.lower() for c in dns_cnames]
        self.resolved_ips = resolved_ips or []

    def run_analysis(self) -> Dict[str, Any]:
        """Inspect headers, DNS pointers, and IP PTR records for cloud signatures."""
        findings: List[CloudFinding] = []
        limitations: List[str] = []

        # 1. Inspect AWS Indicators
        self._inspect_aws(findings)

        # 2. Inspect Cloudflare
        self._inspect_cloudflare(findings)

        # 3. Inspect Google Cloud (GCP)
        self._inspect_gcp(findings)

        # 4. Inspect Microsoft Azure
        self._inspect_azure(findings)

        # 5. Inspect IP PTR and Infrastructure Providers
        self._inspect_ip_and_ptr(findings)

        results = [
            {
                "provider": f.provider,
                "service": f.service,
                "evidence": f.evidence,
                "region": f.region or "Inconclusive / Not Disclosed",
                "region_confidence": f.region_confidence,
                "details": f.details
            }
            for f in findings
        ]

        limitations.append(
            "Cloud indicators rely on publicly observable response headers and DNS CNAME pointers. "
            "Origin servers deployed behind multi-region edge CDNs often hide backend cloud regions."
        )

        return {
            "total_indicators": len(results),
            "cloud_indicators": results,
            "limitations": limitations
        }

    def _inspect_aws(self, findings: List[CloudFinding]):
        # AWS CloudFront Header checks
        cf_id = self.headers.get("x-amz-cf-id")
        cf_pop = self.headers.get("x-amz-cf-pop")
        via_header = self.headers.get("via", "")

        is_cloudfront = cf_id is not None or "cloudfront" in via_header.lower()
        if not is_cloudfront:
            for cname in self.cnames:
                if "cloudfront.net" in cname:
                    is_cloudfront = True
                    break

        if is_cloudfront:
            region_str = None
            region_conf = "UNVERIFIED"
            details = "Traffic is served through Amazon CloudFront edge network."

            if cf_pop:
                # Format: IAD89-C1 or similar (first 3 letters are airport code)
                iata = cf_pop[:3].upper()
                if iata in POP_IATA_MAP:
                    geo_name, probable_reg = POP_IATA_MAP[iata]
                    region_str = f"{geo_name} (Edge POP: {cf_pop})"
                    region_conf = "HEURISTIC_EDGE_ONLY"
                    details += f" Edge POP '{cf_pop}' is located in {geo_name}. Note: This identifies the edge point of presence serving the client request, not necessarily the origin server region."

            findings.append(CloudFinding(
                provider="Amazon Web Services (AWS)",
                service="Amazon CloudFront",
                evidence=f"x-amz-cf-id: {cf_id or 'CNAME pointer'}, x-amz-cf-pop: {cf_pop or 'N/A'}",
                region=region_str,
                region_confidence=region_conf,
                details=details
            ))

        # AWS S3 Direct or Origin
        s3_region_hdr = self.headers.get("x-amz-bucket-region")
        s3_req_id = self.headers.get("x-amz-request-id")
        
        is_s3 = s3_region_hdr is not None or s3_req_id is not None
        s3_cname_target = None
        for cname in self.cnames:
            if "s3.amazonaws.com" in cname or "s3-website" in cname:
                is_s3 = True
                s3_cname_target = cname
                break

        if is_s3:
            region_str = s3_region_hdr
            region_conf = "CONFIRMED" if s3_region_hdr else "UNVERIFIED"

            # Check if region is embedded in CNAME e.g. bucket.s3.us-west-2.amazonaws.com
            if not region_str and s3_cname_target:
                match = re.search(r"s3[.-]([a-z0-9\-]+)\.amazonaws\.com", s3_cname_target)
                if match and match.group(1) not in ["website", "dualstack"]:
                    region_str = match.group(1)
                    region_conf = "CONFIRMED"

            findings.append(CloudFinding(
                provider="Amazon Web Services (AWS)",
                service="Amazon Simple Storage Service (S3)",
                evidence=f"x-amz-bucket-region: {s3_region_hdr or 'None'}, CNAME: {s3_cname_target or 'None'}",
                region=region_str,
                region_confidence=region_conf,
                details="Storage backend indicators match Amazon S3."
            ))

        # AWS Application/Elastic Load Balancer
        for cname in self.cnames:
            if "elb.amazonaws.com" in cname:
                # e.g. my-lb-1234.us-east-1.elb.amazonaws.com
                reg_match = re.search(r"\.([a-z0-9\-]+)\.elb\.amazonaws\.com", cname)
                region = reg_match.group(1) if reg_match else None
                findings.append(CloudFinding(
                    provider="Amazon Web Services (AWS)",
                    service="Elastic Load Balancing (ELB/ALB)",
                    evidence=f"DNS CNAME pointer: {cname}",
                    region=region,
                    region_confidence="CONFIRMED" if region else "UNVERIFIED",
                    details=f"Host points directly to an AWS Elastic Load Balancer ({region or 'unspecified region'})."
                ))

    def _inspect_cloudflare(self, findings: List[CloudFinding]):
        cf_ray = self.headers.get("cf-ray")
        server = self.headers.get("server", "").lower()
        if cf_ray or "cloudflare" in server:
            edge_loc = None
            if cf_ray and "-" in cf_ray:
                pop_code = cf_ray.split("-")[-1].strip().upper()
                if pop_code in POP_IATA_MAP:
                    geo_name, _ = POP_IATA_MAP[pop_code]
                    edge_loc = f"{geo_name} (Colo: {pop_code})"

            findings.append(CloudFinding(
                provider="Cloudflare",
                service="Cloudflare Global Anycast CDN & WAF",
                evidence=f"cf-ray: {cf_ray or 'N/A'}, server: {self.headers.get('server', 'N/A')}",
                region=edge_loc,
                region_confidence="HEURISTIC_EDGE_ONLY" if edge_loc else "UNVERIFIED",
                details="Traffic is reverse-proxied through Cloudflare's Anycast edge network."
            ))

    def _inspect_gcp(self, findings: List[CloudFinding]):
        if "x-goog-generation" in self.headers or "x-guploader-uploadid" in self.headers:
            findings.append(CloudFinding(
                provider="Google Cloud Platform (GCP)",
                service="Google Cloud Storage / App Engine",
                evidence=f"Header x-goog-generation: {self.headers.get('x-goog-generation', 'Present')}",
                region=None,
                region_confidence="UNVERIFIED",
                details="Public headers reveal Google Cloud Platform storage or proxy frontend."
            ))

    def _inspect_azure(self, findings: List[CloudFinding]):
        azure_ref = self.headers.get("x-azure-ref")
        is_azure = azure_ref is not None
        for cname in self.cnames:
            if "azurewebsites.net" in cname or "trafficmanager.net" in cname:
                is_azure = True
                break

        if is_azure:
            findings.append(CloudFinding(
                provider="Microsoft Azure",
                service="Azure App Service / Front Door",
                evidence=f"x-azure-ref: {azure_ref or 'CNAME pointer'}",
                region=None,
                region_confidence="UNVERIFIED",
                details="Response headers or DNS routing match Microsoft Azure infrastructure."
            ))

    def _inspect_ip_and_ptr(self, findings: List[CloudFinding]):
        """Inspect reverse DNS PTR and known IP infrastructure for hosting provider."""
        import socket
        already_providers = {f.provider for f in findings}

        for ip in self.resolved_ips:
            ptr_name = ""
            try:
                host_info = socket.gethostbyaddr(ip)
                ptr_name = host_info[0].lower() if host_info else ""
            except Exception:
                pass

            # AWS EC2 PTR check (e.g. ec2-13-50-251-226.eu-north-1.compute.amazonaws.com)
            if "amazonaws.com" in ptr_name:
                region_match = re.search(r"\.([a-z0-9\-]+)\.compute\.amazonaws\.com", ptr_name)
                region = region_match.group(1) if region_match else "AWS Cloud"
                findings.append(CloudFinding(
                    provider="Amazon Web Services (AWS)",
                    service="Amazon EC2 / Elastic IP",
                    evidence=f"IP {ip} resolves to PTR '{ptr_name}'",
                    region=region,
                    region_confidence="CONFIRMED" if region_match else "HIGH",
                    details=f"Host is directly deployed on AWS compute infrastructure (Region: {region})."
                ))
                already_providers.add("Amazon Web Services (AWS)")
            elif "googleusercontent.com" in ptr_name or "1e100.net" in ptr_name:
                if "Google Cloud Platform (GCP)" not in already_providers:
                    findings.append(CloudFinding(
                        provider="Google Cloud Platform (GCP)",
                        service="Google Compute / Cloud Run",
                        evidence=f"IP {ip} resolves to PTR '{ptr_name}'",
                        region="Global / GCP",
                        region_confidence="HIGH",
                        details="Host is deployed on Google Cloud Platform infrastructure."
                    ))
                    already_providers.add("Google Cloud Platform (GCP)")
            elif "azure" in ptr_name or "cloudapp.net" in ptr_name:
                if "Microsoft Azure" not in already_providers:
                    findings.append(CloudFinding(
                        provider="Microsoft Azure",
                        service="Azure Virtual Machines / App Service",
                        evidence=f"IP {ip} resolves to PTR '{ptr_name}'",
                        region="Azure Cloud",
                        region_confidence="HIGH",
                        details="Host is hosted on Microsoft Azure cloud infrastructure."
                    ))
                    already_providers.add("Microsoft Azure")
            elif "digitalocean" in ptr_name:
                if "DigitalOcean" not in already_providers:
                    findings.append(CloudFinding(
                        provider="DigitalOcean",
                        service="DigitalOcean Droplet",
                        evidence=f"IP {ip} resolves to PTR '{ptr_name}'",
                        region="DigitalOcean Cloud",
                        region_confidence="CONFIRMED",
                        details="Host is hosted on DigitalOcean compute infrastructure."
                    ))
                    already_providers.add("DigitalOcean")
            elif "hostinger" in ptr_name:
                if "Hostinger" not in already_providers:
                    findings.append(CloudFinding(
                        provider="Hostinger",
                        service="Hostinger Cloud / VPS",
                        evidence=f"IP {ip} resolves to PTR '{ptr_name}'",
                        region="Hostinger Data Center",
                        region_confidence="CONFIRMED",
                        details="Host is deployed on Hostinger infrastructure."
                    ))
                    already_providers.add("Hostinger")
