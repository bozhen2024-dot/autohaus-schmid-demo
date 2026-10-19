# Autohaus Schmid — public website demo

Approved V4.1.6 visual demonstration. This repository contains static public website files only; the management system and backend source are retained in a separate private repository.

The catalogue is a dated snapshot of the working public API. Models are not physical stock; unpublished/archived vehicles are not exported. There is no live PostgreSQL synchronisation. Contact forms open an email draft only: nothing is stored or sent by this static site. Staff access links explain that administration belongs to the separate working system. No users, sessions, private API, SMTP credentials, enquiries or database dumps are included.

Pages publishes **site/** only using the included workflow. The website URL must be taken from a successful Pages deployment, not inferred from this repository URL. This is a presentation for owner review, not a production transaction service. Noindex is retained.

Third-party licence notices are preserved under site/assets (Three.js MIT, Manrope/DM Serif OFL); HDR provenance is CC0 Poly Haven. Existing branding, business/model photos and supplied videos are included with the user's explicit permission for public demonstration. See demo-hinweise.html for limitations.

To update: rebuild an authorised public snapshot from the private working installation, run the prefix/browser/secret checks, replace site/ without adding private folders, commit and push main. Inspect the Actions result and test the actual HTTPS URL after every update. Never copy the private repository or its .env/database/admin into site/.
