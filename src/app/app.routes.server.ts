import {RenderMode, ServerRoute} from '@angular/ssr';

export const serverRoutes: ServerRoute[] = [
  {
    path: 'teachers/:id',
    renderMode: RenderMode.Server,
  },
  {
    path: 'lesson-plan/:id',
    renderMode: RenderMode.Server,
  },
  {
    path: 'infographic/:id',
    renderMode: RenderMode.Server,
  },
  {
    path: 'series/:id',
    renderMode: RenderMode.Server,
  },
  {
    // Parascolaire pages load their catalog in the browser: no prerender for the parameterised routes.
    path: 'parascolaire/:classe/:livre',
    renderMode: RenderMode.Client,
  },
  {
    path: 'parascolaire/:classe/:livre/:theme',
    renderMode: RenderMode.Client,
  },
  {
    path: '**',
    renderMode: RenderMode.Prerender,
  },
];
