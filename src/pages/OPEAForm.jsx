import { useState } from "react";
import { db } from "../firebase";
import { ref, push } from "firebase/database";

const init = { clientName:"", date:"", therapist:"", occupation:"", performance:"", environment:"", affect:"", notes:"" };

function OPEAForm() {
  const [form, setForm] = useState(init);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState(null);
  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });
  const handleSubmit = async (e) => {
    e.preventDefault(); setError(null);
    try {
      await push(ref(db, "opea-submissions"), { ...form, timestamp: new Date().toISOString() });
      setSubmitted(true); setForm(init);
    } catch (err) { setError("Submission failed: " + err.message); }
  };
  if (submitted) return (
    <div className="page success">
      <h2>OPEA Form Submitted!</h2>
      <p>Assessment saved successfully.</p>
      <button onClick={() => setSubmitted(false)}>Submit Another</button>
    </div>
  );
  return (
    <div className="page">
      <h2>OPEA Assessment Form</h2>
      {error && <p className="error">{error}</p>}
      <form onSubmit={handleSubmit} className="form-grid">
        <label>Client Name<input name="clientName" value={form.clientName} onChange={handleChange} required /></label>
        <label>Date<input type="date" name="date" value={form.date} onChange={handleChange} required /></label>
        <label>Therapist<input name="therapist" value={form.therapist} onChange={handleChange} required /></label>
        <label>Occupation / Activity<input name="occupation" value={form.occupation} onChange={handleChange} required placeholder="e.g. School task, Self-care" /></label>
        <fieldset><legend>Performance Level</legend>
          {["Independent","Assisted","Dependent"].map(l => <label key={l} className="radio-label"><input type="radio" name="performance" value={l} checked={form.performance===l} onChange={handleChange} required />{l}</label>)}
        </fieldset>
        <label>Environment
          <select name="environment" value={form.environment} onChange={handleChange} required>
            <option value="">Select environment</option>
            {["Home","School","Clinic","Community","Other"].map(o => <option key={o}>{o}</option>)}
          </select>
        </label>
        <fieldset><legend>Affect / Emotional State</legend>
          {["Positive","Neutral","Negative"].map(l => <label key={l} className="radio-label"><input type="radio" name="affect" value={l} checked={form.affect===l} onChange={handleChange} required />{l}</label>)}
        </fieldset>
        <label>Notes<textarea name="notes" value={form.notes} onChange={handleChange} rows={4} /></label>
        <button type="submit">Submit OPEA Assessment</button>
      </form>
    </div>
  );
}

export default OPEAForm;