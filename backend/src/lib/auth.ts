import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { prisma } from "./prisma";
import { bearer } from "better-auth/plugins";

export const auth = betterAuth({
    database: prismaAdapter(prisma, {
        provider: "postgresql",
    }),
    emailAndPassword: {
        enabled: true,
    },
    secret: process.env.BETTER_AUTH_SECRET || "my-super-secret-better-auth-secret",
    trustedOrigins: ["http://localhost:3000"],
    plugins: [bearer()],
    databaseHooks: {
        user: {
            create: {
                after: async (user) => {
                    // Create default organization and member
                    const org = await prisma.organization.create({
                        data: {
                            name: `${user.name || 'User'}'s Organization`,
                        }
                    });
                    await prisma.member.create({
                        data: {
                            userId: user.id,
                            organizationId: org.id,
                            role: "ADMIN"
                        }
                    });
                }
            }
        }
    }
});
