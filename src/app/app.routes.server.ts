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
    path: '**',
    renderMode: RenderMode.Prerender,
  },
];
