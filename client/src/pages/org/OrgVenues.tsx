import { Link } from "react-router-dom";
import { VenueBrowser } from "../../components/VenueBrowser";

export default function OrgVenues() {
  return (
    <VenueBrowser
      endpoint="/organization/venues"
      title="Training venues"
      intro="Hotels, resorts and team-building grounds for your sessions, with indicative prices. When you award a tender or add a booking, Capacity Lane suggests venues that fit your group automatically."
      footer={
        <div className="rounded-2xl border border-line bg-panel p-5 text-sm text-muted">
          Ready to book a training? Head to <Link to="/org/bookings" className="font-semibold text-teal hover:underline">Bookings</Link> or award a{" "}
          <Link to="/org/tenders" className="font-semibold text-teal hover:underline">tender</Link> — we'll suggest matching venues with prices.
        </div>
      }
    />
  );
}
