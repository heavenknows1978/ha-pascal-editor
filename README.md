# Pascal Editor for Home Assistant

A Home Assistant add-on that runs the open-source [Pascal Editor](https://github.com/pascalorg/editor)
(MIT) — a browser-based 3D architectural editor — as a sidebar panel through ingress.

## Install

1. Home Assistant → **Settings → Add-ons → Add-on store → ⋮ → Repositories** and add
   `https://github.com/heavenknows1978/ha-pascal-editor`.
2. Install **Pascal Editor**, start it, and open **Pascal Editor** from the sidebar.

The first install builds the image on your Home Assistant host (a few minutes).

## How it works

* The Dockerfile fetches a **pinned upstream commit** of Pascal and applies small patches
  (`pascal-editor/patches`) so it can run under the ingress path:
  * `basePath` is built as a placeholder and replaced with the real ingress path at start (`run.sh`).
  * A tiny browser shim prefixes root-relative URLs (`fetch`, images, audio, workers).
  * nginx re-adds the ingress prefix that Supervisor strips, and drops the browser `Origin` header so the
    scene API's same-origin check accepts requests coming through Home Assistant.
* Projects are stored in SQLite under the add-on's persistent `/data`, so they are included in backups.
* WebGPU needs a secure context, which Home Assistant over HTTPS provides.

## Notes

* Toolbar icons are fetched from `api.iconify.design`, so the browser needs internet access.
* The panel is admin-only (`panel_admin: true`).
