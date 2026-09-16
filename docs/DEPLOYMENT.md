# Deployment

Use the [README hosting and authentication instructions](../README.md#hosting-and-authentication). This version requires a Worker, D1 database and private R2 bucket. Static hosting of `public/` alone does not provide the studio, project data or protected media.

Never expose trusted identity headers on an independent public Worker origin. Use the Sites authentication dispatcher or implement cryptographically verified sessions for a different provider. Configure the owner ID on the server, never in public source.

The live site and open-source repository are separate. Merging GitHub source does not itself change the Site deployment. Build and deploy the exact reviewed source through the hosting provider. Applied database migration history must remain intact.
