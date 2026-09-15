import { Link } from "react-router-dom";
import { VenueBrowser } from "../../components/VenueBrowser";

export default function ProviderVenues() {
  return (
    <VenueBrowser
      endpoint="/provider/venues"
      title="Venues for your trainings"
      intro="Scanning for the right place to run a workshop or event? Browse hotels, resorts and team-building grounds across Uganda with capacities and indicative prices, then reach out to the venue directly to book."
      footer={
        <div className="rounded-2xl border border-line bg-panel p-5 text-sm text-muted">
          Planning a course? List it under <Link to="/provider/courses" className="font-semibold text-teal hover:underline">My courses</Link> so organisations can discover and enrol, then pick a venue that fits your expected cohort.
        </div>
      }
    />
  );
}
