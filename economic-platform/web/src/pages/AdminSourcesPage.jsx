import ReferenceDataAdmin from '../components/ReferenceDataAdmin.jsx';
import { api } from '../api/client.js';

export default function AdminSourcesPage() {
  return (
    <ReferenceDataAdmin
      title="Sources"
      description="Data sources indicators can be attributed to. Deactivate instead of deleting to preserve history; merge to clean up duplicates."
      extraFieldKey="url"
      extraFieldLabel="URL"
      api={{
        list: api.listSources,
        create: api.createSource,
        deactivate: api.deactivateSource,
        reactivate: api.reactivateSource,
        merge: api.mergeSource,
      }}
    />
  );
}
