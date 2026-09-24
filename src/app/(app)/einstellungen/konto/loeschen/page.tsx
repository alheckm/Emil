import { Screen } from "@/components/ui";
import { DeleteAccount } from "./DeleteAccount";

export const metadata = { title: "Konto löschen" };

/**
 * Eigene Unterseite statt Karte im Konto-Hub (DESIGN.md „Konto") — die
 * Gefahrenzone bekommt so einen ganzen Screen für sich, statt neben
 * Abmelden und Namensfeld gleichrangig zu stehen.
 */
export default function DeleteAccountPage() {
  return (
    <Screen title="Konto löschen">
      <DeleteAccount />
    </Screen>
  );
}
