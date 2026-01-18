import { getSystemSettings } from "@/lib/settings";
import YardimMerkeziClient from "./YardimMerkeziClient";

export default async function YardimMerkeziPage() {
    const settings = await getSystemSettings();

    return <YardimMerkeziClient settings={settings} />;
}
