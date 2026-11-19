"""Check an nginx version against nginx.org's security advisories.

Trivy cannot do this for our image: nginx:*-alpine installs nginx from
nginx.org's own apk repository, and Trivy matches Alpine packages against
Alpine's security database, which only covers Alpine's own nginx package. So
the image scan sees every library around nginx but never nginx itself.

nginx.org's advisory page is the primary source and lists a CVE with its
affected range on the day of the fix; NVD can take days to attach version data
to the same CVE.

Usage: check_nginx_advisories.py VERSION [--fail-on major|medium|low] [--html FILE]

Exits 1 if VERSION is affected by an advisory at or above --fail-on (default
major), 2 if the page could not be read or parsed. Every match is printed, and
written as a table to $GITHUB_STEP_SUMMARY when that is set.
"""

import argparse
import html
import os
import re
import sys
import urllib.request

URL = "https://nginx.org/en/security_advisories.html"
# nginx.org also uses "minor" (same rank as "low") and "none" (an
# informational entry, CVE-2009-4487, that matches every version).
SEVERITIES = ["low", "medium", "major"]
ALIASES = {"minor": "low"}
VERSION_RE = r"\d+(?:\.\d+)*"


def parse_version(text):
    return tuple(int(part) for part in text.split("."))


def strip_tags(text):
    return html.unescape(re.sub(r"<[^>]+>", "", text)).strip()


def affects(ranges, version):
    """True if `version` falls in a "Vulnerable:" list such as
    "1.1.4-1.2.8, 1.3.9-1.4.0", "1.25.3" or "all"."""
    for token in (t.strip() for t in ranges.split(",")):
        if token == "all":
            return True
        # Windows-only issues; the image is Linux.
        if token.startswith("nginx/Windows"):
            continue
        match = re.fullmatch(rf"({VERSION_RE})(?:-({VERSION_RE}))?", token)
        if not match:
            print(f"::warning::Unparsed range {token!r} on {URL}", file=sys.stderr)
            continue
        low = parse_version(match.group(1))
        high = parse_version(match.group(2) or match.group(1))
        if low <= version <= high:
            return True
    return False


def parse_advisories(page):
    advisories = []
    for item in re.findall(r"<li>\s*<p>(.*?)</p>\s*</li>", page, re.S):
        fields = {}
        parts = [strip_tags(p) for p in re.split(r"<br\s*/?>", item)]
        fields["title"] = parts[0]
        for part in parts[1:]:
            key, sep, value = part.partition(":")
            if sep:
                fields[key.strip().lower()] = value.strip()
        if "vulnerable" not in fields or "severity" not in fields:
            continue
        severity = fields["severity"].lower()
        if severity == "none":
            continue
        severity = ALIASES.get(severity, severity)
        if severity not in SEVERITIES:
            # Rank an unknown severity as the highest, so a new label can only
            # cause a false alarm, never a missed one.
            print(f"::warning::Unknown severity {severity!r} on {URL}", file=sys.stderr)
            severity = SEVERITIES[-1]
        fields["severity"] = severity
        fields["cves"] = sorted(set(re.findall(r"CVE-\d{4}-\d+", item)))
        advisories.append(fields)
    return advisories


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("version")
    parser.add_argument("--fail-on", choices=SEVERITIES, default="major")
    parser.add_argument("--html", help="Read the advisory page from a file instead of nginx.org")
    args = parser.parse_args()

    version = parse_version(args.version)
    try:
        if args.html:
            with open(args.html, encoding="utf-8") as f:
                page = f.read()
        else:
            request = urllib.request.Request(URL, headers={"User-Agent": "voteit-frontend-ci"})
            with urllib.request.urlopen(request, timeout=30) as response:
                page = response.read().decode("utf-8")
    except OSError as exc:
        print(f"::error::Could not fetch {URL}: {exc}")
        return 2

    advisories = parse_advisories(page)
    # An empty result would read as "not vulnerable". If the page layout
    # changes, fail loudly instead of passing silently from then on.
    if len(advisories) < 20:
        print(f"::error::Only {len(advisories)} advisories parsed from {URL}; has the page layout changed?")
        return 2

    threshold = SEVERITIES.index(args.fail_on)
    matches = [a for a in advisories if affects(a["vulnerable"], version)]
    failing = [a for a in matches if SEVERITIES.index(a["severity"]) >= threshold]

    print(f"nginx {args.version}: {len(matches)} of {len(advisories)} advisories apply")
    for a in matches:
        level = "error" if a in failing else "warning"
        print(f"::{level}::{', '.join(a['cves']) or 'no CVE'} ({a['severity']}): {a['title']}"
              f" -- not vulnerable: {a.get('not vulnerable', '?')}")

    summary = os.environ.get("GITHUB_STEP_SUMMARY")
    if summary:
        with open(summary, "a", encoding="utf-8") as f:
            f.write(f"### nginx {args.version} vs [nginx.org advisories]({URL})\n\n")
            if not matches:
                f.write("No advisories apply.\n")
            else:
                f.write("| CVE | Severity | Issue | Not vulnerable |\n|---|---|---|---|\n")
                for a in matches:
                    f.write(f"| {', '.join(a['cves'])} | {a['severity']} | {a['title']}"
                            f" | {a.get('not vulnerable', '?')} |\n")
    return 1 if failing else 0


if __name__ == "__main__":
    sys.exit(main())
