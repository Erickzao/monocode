# Figma Desktop

MonoCode pairs with a local plugin that runs in Figma Desktop. No Figma account
token or OAuth app is involved: the plugin reads the file you have open and talks
to MonoCode on this computer.

## Set up

1. Open **Settings → Connections → Figma** and select **Turn on**. MonoCode starts
   a WebSocket bridge on `localhost:3056`, bound to the loopback interface only.
2. Select **Install plugin**. MonoCode writes the plugin to its local data
   directory and shows the path of its `manifest.json`.
3. In Figma Desktop, open **Plugins → Development → Import plugin from
   manifest…** and choose that manifest.
4. Run **MonoCode Figma Bridge** from **Plugins → Development** in any design
   file. It connects while MonoCode is open and reconnects on its own.

Turning the bridge on also adds a **Figma** tab to the workspace sidebar.

## Live selection

The Figma tab follows the selection in every connected file: the file and page,
the selected layer's name, type, size, and a rendered preview. Selecting several
layers shows the count; generation needs exactly one layer.

## Generate a component

Select **Generate component** in the Figma tab, or **Generate in MonoCode** in the
plugin window. The plugin captures the layer as Figma's REST JSON (layout, fills,
strokes, effects, typography, component properties, inline SVG for vector layers),
every image fill, and a PNG preview. Image fills over 8 MB in total are re-encoded
in the plugin before they are sent.

MonoCode validates the capture and stages it under its local data directory in
`figma/generations/<id>/`:

- `source-bundle.json` — the layer tree, without inline image data
- `assets/` and `assets/manifest.json` — every image fill, keyed by its Figma hash
- `preview.png` — the rendered layer

The component is generated in the session selected in the current project — the
focused session of the active tab. MonoCode copies the capture into
`.monocode/figma/<id>/design/` inside that session's working folder (its
worktree, when it has one), attaches the preview, and asks the agent for a
pixel-perfect (1:1) component in the project's own stack and conventions.

The agent writes the component files into `.monocode/figma/<id>/`, so the chat
shows each one as a compact file row with its preview, and answers in a few
lines that reference the files instead of pasting their code. Nothing else in
the project changes until you review the preview and ask the agent to implement
it. `.monocode/` carries its own `.gitignore`, so git ignores the previews
without touching the project's `.gitignore`; the 20 most recent previews are
kept.

A busy session queues the component for after its current turn. When the
project has no selected session, a new one is started for it. Remote projects
are not supported yet, because the captures stay on this computer. The 20 most
recent captures are kept in MonoCode's data directory as well.

## Choose the agent and model

Above **Generate component**, the Figma tab shows the agent and model that will
generate the component, with its effort and other model options.

With a session selected, the picker shows that session's agent and model.
Changing it changes the session's model, exactly as the composer's picker does.

When the project has no selected session, the picker shows what the new session
will start with:

- **Project default** — the project's new-conversation agent and model from
  **Settings → Providers**.
- **Figma default** — set in **Settings → Connections → Figma → Generation
  model**. **Use project default** removes it.
- **Picked here** — another agent or model chosen in the Figma tab. It applies to
  that project until MonoCode restarts; **Reset** returns to the default.

Generations started from the plugin window use the same choice. Agents that
cannot take attachments, such as fx, get the preview's file path in the prompt
instead of an attached image.

## Security

- The bridge listens on `127.0.0.1` only. Every connection must present the
  pairing key embedded in the installed plugin; Figma's plugin origin (`null`) and
  `https://*.figma.com` are the only browser origins accepted.
- After the key check, each connection completes a second handshake with a
  per-connection session token before it can exchange messages.
- Previews are written only inside the session's working folder, under
  `.monocode/figma/`. MonoCode refuses to write through a linked `.monocode` or
  `figma` folder, and never overwrites an existing `.monocode/.gitignore`.
- MonoCode only asks the plugin for the selection, a preview, or a capture. The
  plugin has no commands that change the Figma file.
- Captured images must match their declared PNG, JPEG, GIF, or WebP signatures and
  size limits before they are written, and asset file names are derived from
  their validated hashes.
- Layer names and text from Figma reach the agent as design content; the prompt
  tells the agent not to follow instructions found inside the design.
- **Reset pairing** disconnects every plugin, issues a new key, and rewrites the
  installed plugin. Run the plugin again in Figma to reconnect. The key and the
  plugin files live in the app's local data directory; on Unix they are created
  with owner-only permissions.
