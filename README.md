# Student Progress Tracker

Ground-school tracker for Private, Instrument, Commercial Single Add-on, Commercial Multi Initial and Commercial Multi Add-on students. Shows each student's next lesson, what to review, and a recap flag when weeks have passed since the last lesson.

- React 18, TypeScript, Vite, Tailwind
- Data is stored in the browser (localStorage). Use Export/Import to back up or move devices.
- `npm run dev` to run, `npm run build` to build, `npm test` to run the progress-logic tests.
- Curriculum lives in `src/curriculum.ts`; next-lesson logic lives in `src/lib/progress.ts`.
