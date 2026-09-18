#!/usr/bin/env python3
"""Add cards for the owner's GitHub Pages repositories to a staged index."""

import html
import json
import os
import sys
import urllib.error
import urllib.parse
import urllib.request


PLACEHOLDER = "<!-- External repository cards -->"
API_ROOT = "https://api.github.com"


def api_get(path, token):
    request = urllib.request.Request(
        f"{API_ROOT}{path}",
        headers={
            "Accept": "application/vnd.github+json",
            "Authorization": f"Bearer {token}",
            "X-GitHub-Api-Version": "2022-11-28",
            "User-Agent": "aont.github.io-pages-build",
        },
    )
    with urllib.request.urlopen(request) as response:
        return json.load(response)


def public_repositories(owner, token):
    repositories = []
    page = 1
    while True:
        query = urllib.parse.urlencode(
            {"type": "public", "sort": "full_name", "per_page": 100, "page": page}
        )
        batch = api_get(f"/users/{urllib.parse.quote(owner)}/repos?{query}", token)
        repositories.extend(batch)
        if len(batch) < 100:
            return repositories
        page += 1


def page_url(repository, token):
    try:
        pages = api_get(f"/repos/{repository['full_name']}/pages", token)
    except urllib.error.HTTPError as error:
        if error.code == 404:
            return None
        raise
    return pages.get("html_url")


def render_card(repository, url):
    name = html.escape(repository["name"])
    description = html.escape(repository.get("description") or "No description provided.")
    href = html.escape(url, quote=True)
    return (
        '    <div class="card">\n'
        f"      <h2>{name}</h2>\n"
        f"      <p>{description}</p>\n"
        f'      <a href="{href}">Open {name} →</a>\n'
        "    </div>"
    )


def main():
    if len(sys.argv) != 2:
        raise SystemExit(f"Usage: {sys.argv[0]} STAGED_INDEX")

    owner = os.environ["GITHUB_REPOSITORY_OWNER"]
    current_repository = os.environ["GITHUB_REPOSITORY"].casefold()
    token = os.environ["GITHUB_TOKEN"]
    index_path = sys.argv[1]

    cards = []
    for repository in public_repositories(owner, token):
        if repository["full_name"].casefold() == current_repository:
            continue
        url = page_url(repository, token)
        if url:
            cards.append(render_card(repository, url))

    with open(index_path, encoding="utf-8") as index_file:
        document = index_file.read()
    if document.count(PLACEHOLDER) != 1:
        raise SystemExit(f"Expected exactly one {PLACEHOLDER!r} in {index_path}")

    generated = "\n\n".join(cards) or "    " + PLACEHOLDER
    with open(index_path, "w", encoding="utf-8") as index_file:
        index_file.write(document.replace("    " + PLACEHOLDER, generated))

    print(f"Generated {len(cards)} external repository card(s)")


if __name__ == "__main__":
    main()
