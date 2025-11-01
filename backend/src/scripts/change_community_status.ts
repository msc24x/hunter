import readline from 'readline';
import { PrismaClient } from '@prisma/client';
import { sendCommunityStatusChangedEmail } from '../emails/community-status-changed/sender';

const prisma = new PrismaClient();
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
});

function question(prompt: string): Promise<string> {
    return new Promise((resolve) =>
        rl.question(prompt, (ans) => resolve(ans.trim()))
    );
}

async function main() {
    try {
        const idInput = await question('Enter community id: ');
        const id = parseInt(idInput || '', 10);
        if (Number.isNaN(id)) {
            console.log('Invalid id. Exiting.');
            return process.exit(1);
        }

        const community = await prisma.community.findUnique({
            where: { id },
            include: { admin_user: true },
        });

        if (!community) {
            console.log(`Community with id ${id} not found.`);
            return process.exit(1);
        }

        console.log('\nCommunity details:');
        console.log(`  id: ${community.id}`);
        console.log(`  name: ${community.name}`);
        console.log(`  status: ${community.status}`);
        console.log(`  admin_user_id: ${community.admin_user_id}`);
        console.log(`  website_link: ${community.website_link || '-'}`);
        console.log(
            `  description: ${
                community.description
                    ? community.description.slice(0, 200)
                    : '-'
            }`
        );
        console.log('');

        const confirm = (
            await question(
                'Proceed to change status for this community? (y/N): '
            )
        ).toLowerCase();
        if (confirm !== 'y' && confirm !== 'yes') {
            console.log('Aborted by user.');
            return process.exit(0);
        }

        const statuses = [
            'PENDING_APPROVAL',
            'APPROVED',
            'NOT_APPROVED',
            'DISABLED',
        ];
        console.log('\nSelect new status:');
        statuses.forEach((s, idx) => console.log(`  ${idx + 1}) ${s}`));
        const choiceInput = await question('Enter choice number: ');
        const choice = parseInt(choiceInput || '', 10);
        if (Number.isNaN(choice) || choice < 1 || choice > statuses.length) {
            console.log('Invalid choice. Exiting.');
            return process.exit(1);
        }
        const newStatus = statuses[choice - 1] as
            | 'PENDING_APPROVAL'
            | 'APPROVED'
            | 'NOT_APPROVED'
            | 'DISABLED';

        const reason = await question(
            'Optional reason / note (press Enter to skip): '
        );

        // perform update (single operation)
        const updated = await prisma.community.update({
            where: { id },
            data: { status: newStatus },
        });

        console.log(`\nCommunity status updated to ${newStatus}.`);

        // ensure we have admin user info for the email
        let adminUser = (community as any).admin_user;
        if (!adminUser && community.admin_user_id) {
            adminUser = await prisma.users.findUnique({
                where: { id: community.admin_user_id },
            });
        }

        if (!adminUser || !adminUser.email) {
            console.log(
                'Warning: admin user or email not found — skipping email send.'
            );
        } else {
            // send email (do not block on failure)
            await sendCommunityStatusChangedEmail({
                user: adminUser,
                community: updated as any,
                reason: reason || '',
            });
            console.log('Notification email queued/sent to admin.');
        }

        return process.exit(0);
    } catch (err) {
        console.error('Error:', err);
        return process.exit(1);
    } finally {
        try {
            await prisma.$disconnect();
        } catch {}
        rl.close();
    }
}

main();
