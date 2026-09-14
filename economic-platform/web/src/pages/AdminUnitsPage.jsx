import ReferenceDataAdmin from '../components/ReferenceDataAdmin.jsx';
import { api } from '../api/client.js';

export default function AdminUnitsPage() {
  return (
    <ReferenceDataAdmin
      title="Units"
      description="Units of measure indicators can be expressed in. Deactivate instead of deleting to preserve history; merge to clean up duplicates."
      extraFieldKey="symbol"
      extraFieldLabel="Symbol"
      api={{
        list: api.listUnits,
        create: api.createUnit,
        deactivate: api.deactivateUnit,
        reactivate: api.reactivateUnit,
        merge: api.mergeUnit,
      }}
    />
  );
}
