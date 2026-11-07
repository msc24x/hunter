import { Component, OnInit } from '@angular/core';
import { Meta } from '@angular/platform-browser';
import { MatSnackBar } from '@angular/material/snack-bar';
import { faCopy } from '@fortawesome/free-regular-svg-icons';
import { AuthService } from 'src/app/services/auth/auth.service';
import { apiEndpoints, UserInfo } from 'src/environments/environment';

@Component({
    selector: 'docs-mcp',
    templateUrl: './docs-mcp.component.html',
    styleUrls: ['./docs-mcp.component.scss'],
})
export class DocsMcpComponent implements OnInit {
    readonly mcpEndpoint = apiEndpoints.mcp;
    copyIcon = faCopy;
    isAuthenticated = false;
    userId = 0;

    mcpConfigExample = `{
    "mcpServers": {
        "hunter": {
            "url": "${apiEndpoints.mcp}",
            "headers": {
                "Authorization": "Bearer <your-token>"
            }
        }
    }
}`;

    constructor(
        private meta: Meta,
        private snackBar: MatSnackBar,
        private authService: AuthService,
    ) {}

    ngOnInit(): void {
        this.isAuthenticated = this.authService.isAuthenticated.value;
        this.userId = this.authService.user?.id ?? 0;
        this.authService.isAuthenticated.subscribe((isAuth) => {
            this.isAuthenticated = isAuth;
            this.userId = this.authService.user?.id ?? 0;
        });

        if (!this.isAuthenticated) {
            this.authService.authenticate_credentials().subscribe((res) => {
                if (res.status == 202) {
                    this.authService.user = res.body as UserInfo;
                    this.authService.isAuthenticated.next(true);
                }
            });
        }

        const title =
            'Hunter MCP Server - Let AI assistants manage your contests';
        const description =
            'Hunter exposes a host-only MCP endpoint so AI tools like Devin, Claude, and Cursor can create contests, add questions of every type, upload test files, verify solutions, and publish - all through your Hunter account.';

        this.meta.updateTag({ name: 'description', content: description });
        this.meta.updateTag({ property: 'og:title', content: title });
        this.meta.updateTag({
            property: 'og:description',
            content: description,
        });
        this.meta.updateTag({ property: 'og:type', content: 'article' });
        this.meta.updateTag({ name: 'twitter:card', content: 'summary' });
    }

    copyConfig() {
        navigator.clipboard.writeText(this.mcpConfigExample).then(() => {
            this.snackBar.open('Config copied to clipboard', 'Dismiss');
        });
    }
}
