import ejs from 'ejs';
import juice from 'juice';
import { readFileSync } from 'fs';
import path from 'path';

export async function render(data: any, dir: string): Promise<string> {
    const templatePath = path.join(__dirname, `./${dir}/html.ejs`);
    const template = readFileSync(templatePath, 'utf-8');

    return juice(
        ejs.render(
            template,
            {
                ...data,
            },
            {
                filename: __dirname,
            }
        )
    );
}
