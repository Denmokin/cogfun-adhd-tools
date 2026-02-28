import { useState } from "react";
import { db } from "../firebase";
import { ref, push } from "firebase/database";

const init = { clientName:"", date:"", therapist:"", attention:"", activity:"", arousal:"", notes:"" };

function AAAForm() {
  const [form, setForm] = useState(init);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState(null);
  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });
  const handleSubmit = async (e) => {
    e.preventDefault(); setError(null);
    try {
      await push(ref(db, "aaa-submissions"), { ...form, timestamp: new Date().toISOString() });
      setSubmitted(true); setForm(init);
    } catch (err) { setError("Submission failed: " + err.message); }
  };
  if (submitted) return (
    <div className="page success">
      <h2>AAA Form Submitted!</h2>
      <p>Assessment saved successfully.</p>
      <button onClick={() => setSubmitted(false)}>Submit Another</button>
    </div>
  );
  return (
    <div className="page">
      <h2>AAA Assessment Form</h2>
      {error && <p className="error">{error}</p>}
      <form onSubmit={handleSubmit} className="form-grid">
        <label>Client Name<input name="clientName" value={form.clientName} onChange={handleChange} required /></label>
        <label>Date<input type="date" name="date" value={form.date} onChange={handleChange} required /></label>
        <label>Therapist<input name="therapist" value={form.therapist} onChange={handleChange} required /></label>
        <fieldset><legend>Attention</legend>
          {["Low","Moderate","High"].map(l => <label key={l} className="radio-label"><input type="radio" name="attention" value={l} checked={form.attention===l} onChange={handleChange} required />{l}</label>)}
        </fieldset>
        <fieldset><legend>Activity Level</legend>
          {["Under-active","Typical","Over-active"].map(l => <label key={l} className="radio-label"><input type="radio" name="activity" value={l} checked={form.activity===l} onChange={handleChange} required />{l}</label>)}
        </fieldset>
        <fieldset><legend>Arousal</legend>
          {["Low","Optimal","High"].map(l => <label key={l} className="radio-label"><input type="radio" name="arousal" value={l} checked={form.arousal===l} onChange={handleChange} required />{l}</label>)}
        </fieldset>
        <label>Notes<textarea name="notes" value={form.notes} onChange={handleChange} rows={4} /></label>
        <button type="submit">Submit AAA Assessment</button>
      </form>
    </div>
  );
}

export default AAAForm;