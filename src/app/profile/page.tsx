import ProfilePageClient from "./ProfilePageClient";

export default function ProfilePage() {
    // Client-only variant to ensure backend cookie is used from the browser context
    return <ProfilePageClient />;
}
