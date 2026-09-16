# Static deployment

The deployable directory is `dist/`. It contains the editable HTML, styles, JavaScript modules, fonts and artwork. No compilation, dependency installation or environment variables are required.

1. Run `npm run check` and `npm test` locally.
2. Choose any static hosting service.
3. Set the publish/output directory to `dist` and leave the build command empty.
4. Ensure `.js` files are served as JavaScript, `.css` as CSS and the font/image files retain their normal MIME types.
5. Open the deployed page and verify both themes, project dialogs and the GitHub links.

For GitHub Pages, an optional deployment workflow can upload `dist/` using GitHub’s Pages artifact actions after enabling Pages in your fork’s settings. The included workflow only runs checks; it does not publish a second site automatically.

Relative asset URLs support deployment at `/` or under a repository subpath. Serve the page over HTTP(S), not `file://`, because it uses ES modules. The optional clipboard feature works on HTTPS and localhost; visitors can select the AI prompt manually if clipboard access is unavailable.

Customize the name, source/profile URLs, project records and prepared AI context before deploying your own version. Keep the license files, including `dist/REFERENCE-LICENSE.txt` and `dist/licenses/`, with distributions.
