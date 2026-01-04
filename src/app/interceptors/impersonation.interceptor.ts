import { Injectable } from '@angular/core';
import {
    HttpRequest,
    HttpHandler,
    HttpEvent,
    HttpInterceptor,
} from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable()
export class ImpersonationInterceptor implements HttpInterceptor {
    constructor() {}

    intercept(
        request: HttpRequest<unknown>,
        next: HttpHandler
    ): Observable<HttpEvent<unknown>> {
        const cookie = document.cookie
            .split('; ')
            .find((row) => row.startsWith('impersonating='))
            ?.split('=')[1];

        if (cookie) {
            document.documentElement.setAttribute(
                'impersonating',
                `You are impersonating the user ${cookie}`
            );
        } else {
            document.documentElement.removeAttribute('impersonating');
        }

        return next.handle(request);
    }
}
