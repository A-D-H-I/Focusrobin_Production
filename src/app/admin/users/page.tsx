import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import UserManagement from './UserManagement';

export default async function AdminUsersPage() {
  const session = await auth();

  // Server-side check: redirect if not logged in or not admin
  if (!session?.user) {
    redirect('/');
  }

  const userRole = (session.user as any)?.role;
  if (userRole !== 'ADMIN') {
    redirect('/');
  }

  // Fetch all users with all their related data
  const users = await prisma.user.findMany({
    include: {
      accounts: true,
      sessions: true,
      prescriptions: true,
      cart: {
        include: {
          items: {
            include: {
              Product: {
                include: {
                  ProductVariant: {
                    include: {
                      ProductAsset: true,
                    },
                  },
                  Category: true,
                },
              },
            },
          },
        },
      },
      wishlist: {
        include: {
          Product: {
            include: {
              ProductVariant: {
                include: {
                  ProductAsset: true,
                },
              },
              Category: true,
            },
          },
        },
      },
      Review: {
        include: {
          Product: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
        },
      },
      wallet: {
        include: {
          transactions: {
            orderBy: { createdAt: 'desc' },
            take: 10,
          },
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  const currentUserId = (session.user as any)?.id;

  // Transform data to match UserManagement expectations (e.g. Decimal -> number)
  const serializedUsers = users.map(user => ({
    ...user,
    wallet: user.wallet ? {
      ...user.wallet,
      balance: Number(user.wallet.balance),
      transactions: user.wallet.transactions.map(t => ({
        ...t,
        amount: Number(t.amount),
      })),
    } : null,
  }));

  return <UserManagement users={serializedUsers as any} currentUserId={currentUserId} />;
}

