import * as Sentry from '@sentry/angular';
import { environment } from './environments/environment';

if (environment.production) {
    Sentry.init({
        dsn: environment.sentry_dsn,
        environment: environment.production ? 'prod' : 'dev',
        release: '1.0.0',
        tracesSampleRate: 0.3,
        integrations: [Sentry.browserTracingIntegration()],
        tracePropagationTargets: [
            'localhost',
            '127.0.0.1',
            /^https:\/\/hunter\.cambo\.in\.com/,
        ],
    });
}
