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
        beforeSend(event, hint) {
            const original = hint?.originalException as
                | { status?: number }
                | undefined;
            if (
                original &&
                (original.status === 401 || original.status === 403)
            ) {
                return null;
            }
            return event;
        },
    });
}
