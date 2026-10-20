import Link from "next/link";

export default function SuperAdminPage() {
    return (
        <div>
            <Link href={'/dashboard/super-admin/create-admin'}>Create Admin</Link><br />
            <Link href={'/dashboard/super-admin/manage-admin'}>Manage Admin</Link>
        </div>
    )
}