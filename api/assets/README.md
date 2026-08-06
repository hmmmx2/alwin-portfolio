# API assets

Drop `resume.pdf` here (or point `RESUME_PATH` somewhere else) to enable the
resume endpoints.

While no file is present:

- `GET /api/resume/meta` returns `{ available: false, … }`
- `GET /api/resume` returns a 404 with an explanatory message
- the web app hides the Resume button entirely

Nothing needs to change in code — the site adapts to whether the file exists.
