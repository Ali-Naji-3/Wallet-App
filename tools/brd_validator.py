#!/usr/bin/env python3
"""
BRD Structure Validator for FXWallet – Business Requirements Document (BRD)

Usage:
  python3 tools/brd_validator.py /absolute/path/to/your/BRD_file.md

This script validates that a given plaintext/Markdown document follows the
specific structure you provided. It checks:
  - Title
  - Section and subsection headings with numbering (1, 1.1, 1.2, ..., 10)
  - Presence of expected key items inside each section/subsection

The matching is tolerant to punctuation, hyphen/en-dash differences, and
whitespace. Items are checked by substring presence within the relevant
section/subsection content.
"""
from __future__ import annotations

import sys
import re
from dataclasses import dataclass, field
from typing import List, Dict, Optional, Tuple


# ---------------------------- Normalization utils ---------------------------- #

_PUNCT_RE = re.compile(r"[^a-z0-9\s]")
_WHITESPACE_RE = re.compile(r"\s+")


def normalize_text(value: str) -> str:
    """
    Normalize text to be case-insensitive and punctuation-insensitive.
    - Lowercase
    - Replace en/em dashes with hyphen
    - Remove non-alphanumeric punctuation
    - Collapse whitespace
    """
    if value is None:
        return ""
    lowered = value.lower()
    lowered = lowered.replace("–", "-").replace("—", "-")
    # Keep alphanumerics and spaces only
    stripped = _PUNCT_RE.sub(" ", lowered)
    collapsed = _WHITESPACE_RE.sub(" ", stripped).strip()
    return collapsed


# ------------------------------- Data structures ----------------------------- #

@dataclass
class ExpectedNode:
    number: str
    title: str
    items: List[str] = field(default_factory=list)
    subsections: List["ExpectedNode"] = field(default_factory=list)

    def all_children(self) -> List["ExpectedNode"]:
        out: List[ExpectedNode] = []
        for child in self.subsections:
            out.append(child)
            out.extend(child.all_children())
        return out


def expected_brd_structure() -> Tuple[str, List[ExpectedNode]]:
    title = "FXWallet – Business Requirements Document (BRD)"

    def node(number: str, title: str, items: Optional[List[str]] = None, subs: Optional[List[ExpectedNode]] = None) -> ExpectedNode:
        return ExpectedNode(number=number, title=title, items=items or [], subsections=subs or [])

    # Section 1
    s1 = node("1", "Project Overview", subs=[
        node("1.1", "Product Name"),
        node("1.2", "Description"),
    ])

    # Section 2
    s21_items = [
        "Provide multi-currency financial management",
        "Increase user engagement through analytics",
        "Monetize via spreads and fees",
        "Build scalable financial infrastructure",
    ]
    s22_items = [
        "Monthly active users",
        "Transaction volume",
        "User retention",
        "Avg. wallet balance",
        "FX conversion frequency",
    ]
    s2 = node("2", "Objectives & Goals", subs=[
        node("2.1", "Business Objectives", items=s21_items),
        node("2.2", "Success Metrics", items=s22_items),
    ])

    # Section 3
    s31_items = [
        "Web application",
        "User profile & KYC",
        "Multi-currency wallets",
        "FX exchange with P&L",
        "User-to-user transfers",
        "Dashboard analytics",
        "Notifications",
        "Admin panel",
        "Audit logging",
    ]
    s32_items = [
        "Native apps",
        "Physical/virtual cards",
        "Crypto support",
    ]
    s3 = node("3", "Scope", subs=[
        node("3.1", "In-Scope", items=s31_items),
        node("3.2", "Out of Scope", items=s32_items),
    ])

    # Section 4
    s41_items = [
        "Product Owner",
        "Engineering",
        "Compliance",
        "Support",
        "Finance Ops",
    ]
    s42_items = [
        "Retail user",
        "Admin user",
    ]
    s4 = node("4", "Stakeholders & Personas", subs=[
        node("4.1", "Stakeholders", items=s41_items),
        node("4.2", "Personas", items=s42_items),
    ])

    # Section 5
    s5_items = [
        "Authentication",
        "KYC",
        "Wallet management",
        "FX rates",
        "Favorite currencies",
        "Deposits/withdrawals",
        "Transfers",
        "History",
        "Dashboard",
        "Notifications",
        "Admin panel",
        "Security",
    ]
    s5 = node("5", "High-Level Features", items=s5_items)

    # Section 6
    s61_items = [
        "Registration: email/password, verification",
        "Login & 2FA",
        "Password reset",
        "Session management",
    ]
    s62_items = [
        "View/edit profile",
        "KYC tiers",
        "Document upload",
    ]
    s63_items = [
        "One wallet per currency",
        "Unique wallet address",
        "Balance & status",
        "Limits",
    ]
    s64_items = [
        "Real-time updates",
        "Buy/sell rates",
        "Rate locking for exchanges",
    ]
    s65_items = [
        "Add/remove favorites",
        "Display in selectors",
    ]
    s66_items = [
        "Bank transfer deposits",
        "Withdrawal processing & limits",
    ]
    s67_items = [
        "Select source/target currency",
        "Preview screen with rate, amount, fees",
        "P&L tracking",
    ]
    s68_items = [
        "Wallet-to-wallet",
        "User-to-user",
        "Cross-currency transfers with preview",
    ]
    s69_items = [
        "Filters",
        "Detailed view",
        "Export statements",
    ]
    s610_items = [
        "Portfolio summary",
        "P&L charts",
        "Wallet list",
        "Activity feed",
        "Currency performance",
    ]
    s611_items = [
        "Transaction",
        "Security",
        "FX alerts",
    ]
    s612_items = [
        "Base currency",
        "Timezone",
        "Language",
        "Security settings",
    ]
    s613_items = [
        "User search",
        "KYC review",
        "Freeze/unfreeze accounts",
        "Transaction monitoring",
        "Configure currencies, rates, fees",
    ]
    s614_items = [
        "HTTPS",
        "Secure password storage",
        "Audit logs",
        "AML flags",
    ]
    s6 = node("6", "Functional Requirements", subs=[
        node("6.1", "Authentication", items=s61_items),
        node("6.2", "Profile & KYC", items=s62_items),
        node("6.3", "Wallets", items=s63_items),
        node("6.4", "FX Rates", items=s64_items),
        node("6.5", "Favorites", items=s65_items),
        node("6.6", "Deposits & Withdrawals", items=s66_items),
        node("6.7", "FX Exchange", items=s67_items),
        node("6.8", "Transfers", items=s68_items),
        node("6.9", "Transaction History", items=s69_items),
        node("6.10", "Dashboard & Analytics", items=s610_items),
        node("6.11", "Notifications", items=s611_items),
        node("6.12", "Settings", items=s612_items),
        node("6.13", "Admin Panel", items=s613_items),
        node("6.14", "Security & Audit", items=s614_items),
    ])

    # Section 7
    s7_items = [
        "Performance (<3s dashboard load)",
        "Availability (99.5%)",
        "Scalability",
        "Usability",
        "Localization-ready",
    ]
    s7 = node("7", "Non-Functional Requirements", items=s7_items)

    # Section 8
    s8_items = [
        "User",
        "Wallet",
        "Currency",
        "FXRate",
        "Transaction",
        "Notification",
        "KYCRecord",
        "AuditLog",
    ]
    s8 = node("8", "Data Model (Entities)", items=s8_items)

    # Section 9
    s9_items = [
        "Web-based application",
        "Region-based restrictions supported",
    ]
    s9 = node("9", "Assumptions", items=s9_items)

    # Section 10
    s10_items = [
        "Mobile apps",
        "Cards",
        "Scheduled exchanges",
        "Advanced analytics",
        "Crypto assets",
    ]
    s10 = node("10", "Future Enhancements", items=s10_items)

    sections = [s1, s2, s3, s4, s5, s6, s7, s8, s9, s10]
    return title, sections


# ------------------------------ Parsing document ----------------------------- #

HEADING_RE = re.compile(r"^\s*(\d+(?:\.\d+)*)\.\s*(.+?)\s*$")


@dataclass
class FoundHeading:
    number: str
    title: str
    line_idx: int

    @property
    def normalized_title(self) -> str:
        return normalize_text(self.title)


def read_text_file(path: str) -> str:
    with open(path, "r", encoding="utf-8", errors="replace") as f:
        return f.read()


def extract_headings(lines: List[str]) -> List[FoundHeading]:
    headings: List[FoundHeading] = []
    for idx, line in enumerate(lines):
        m = HEADING_RE.match(line)
        if m:
            headings.append(FoundHeading(number=m.group(1), title=m.group(2), line_idx=idx))
    return headings


def get_section_span(headings: List[FoundHeading], index: int, total_lines: int) -> Tuple[int, int]:
    """
    Return (start_idx, end_idx_exclusive) for the content span of heading at 'index'.
    Content span includes the heading line itself through the line before the next heading.
    """
    start = headings[index].line_idx
    if index + 1 < len(headings):
        end = headings[index + 1].line_idx
    else:
        end = total_lines
    return start, end


# ------------------------------- Validation core ----------------------------- #

def validate_document(doc_text: str) -> Tuple[bool, List[str]]:
    errors: List[str] = []
    lines = doc_text.splitlines()

    # Title check (first non-empty line)
    expected_title, expected_sections = expected_brd_structure()
    normalized_expected_title = normalize_text(expected_title)
    first_non_empty = ""
    for line in lines:
        if line.strip():
            first_non_empty = line.strip()
            break
    if not first_non_empty:
        errors.append("Document is empty; missing title and content.")
        return False, errors
    if normalize_text(first_non_empty) != normalized_expected_title:
        errors.append(
            f"Title mismatch. Expected: '{expected_title}' | Found: '{first_non_empty}'"
        )

    found_headings = extract_headings(lines)
    if not found_headings:
        errors.append("No numbered headings found (e.g., '1. Project Overview').")
        return False, errors

    # Build quick lookup for found headings by number
    number_to_index: Dict[str, int] = {h.number: i for i, h in enumerate(found_headings)}
    # Also map normalized titles for comparison
    number_to_title_norm: Dict[str, str] = {h.number: h.normalized_title for h in found_headings}

    # Helper to check a single expected node
    def check_node(node: ExpectedNode):
        expected_number = node.number
        expected_title_norm = normalize_text(node.title)

        if expected_number not in number_to_index:
            errors.append(f"Missing heading '{node.number}. {node.title}'.")
            return

        found_idx = number_to_index[expected_number]
        found_title_norm = number_to_title_norm.get(expected_number, "")
        if found_title_norm != expected_title_norm:
            # Titles differ even if numbering matches
            found_title_raw = found_headings[found_idx].title
            errors.append(
                f"Title mismatch for '{expected_number}'. Expected '{node.title}' but found '{found_title_raw}'."
            )

        # If this node (section/subsection) has expected items, check within its content span
        if node.items:
            span_start, span_end = get_section_span(found_headings, found_idx, len(lines))
            section_text = "\n".join(lines[span_start:span_end])
            norm_section_text = normalize_text(section_text)
            for item in node.items:
                item_norm = normalize_text(item)
                if item_norm not in norm_section_text:
                    errors.append(
                        f"Missing item in '{expected_number}. {node.title}': '{item}'."
                    )

        # Recurse for subsections
        for child in node.subsections:
            check_node(child)

    # Validate top-level sections in order and their subsections
    for section in expected_sections:
        check_node(section)

    # Order validation for top-level sections (1..10)
    expected_top_order = [s.number for s in expected_sections]
    found_top_numbers = [h.number for h in found_headings if "." not in h.number]
    # We only check if all expected exist and appear in increasing order
    if all(n in found_top_numbers for n in expected_top_order):
        positions = [found_top_numbers.index(n) for n in expected_top_order]
        if positions != sorted(positions):
            errors.append("Top-level sections are out of order.")
    else:
        # Missing sections already reported; no need to duplicate
        pass

    ok = len(errors) == 0
    return ok, errors


def main(argv: List[str]) -> int:
    if len(argv) != 2:
        print("Usage: python3 tools/brd_validator.py /absolute/path/to/your/BRD_file.md")
        return 2
    target_path = argv[1]
    try:
        text = read_text_file(target_path)
    except FileNotFoundError:
        print(f"Error: File not found: {target_path}")
        return 2
    except Exception as exc:
        print(f"Error: Could not read file '{target_path}': {exc}")
        return 2

    ok, problems = validate_document(text)
    if ok:
        print("OK: Document matches the expected BRD structure.")
        return 0
    print("FAIL: Document does not match the expected BRD structure.")
    for issue in problems:
        print(f"- {issue}")
    return 1


if __name__ == "__main__":
    raise SystemExit(main(sys.argv))


