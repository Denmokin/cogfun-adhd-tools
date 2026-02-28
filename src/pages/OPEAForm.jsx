import { useState } from "react";
import { useAuth } from "../AuthContext";
import { saveResult } from "../lib/resultsApi";

const init = { clientName:"", date:"", therapist:"", observations:"", plan:"" };

export default function OPEAForm() {
  const { user } = useAuth();
  const [form, setForm] = useState(init);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState(null);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    try {
      if (!user) throw new Error("You must be logged in.");

      await saveResult({
        uid: user.uid,
        tool: "OPEA",
        payload: { ...form },
      });

      setSubmitted(true);
      setForm(init);
    } catch (err) {
      setError("Submission failed: " + err.message);
    }
  };

  if (submitted) {
    return (
      <div className="page success">
        <h2>OPEA Form Submitted!</h2>
        <p>Assessment saved successfully.</p>
        <button onClick={() => setSubmitted(false)}>Submit Another</button>
      </div>
    );
  }

  return (
    <div className="page">
      <h2>OPEA Assessment Form</h2>
      {error && <p className="error">{error}</p>}

      <form onSubmit={handleSubmit} className="form-grid">
        <label>
          Client Name
          <input name="clientName" value={form.clientName} onChange={handleChange} required />
        </label>

        <label>
          Date
          <input type="date" name="date" value={form.date} onChange={handleChange} required />
        </label>

        <label>
          Therapist
          <input name="therapist" value={form.therapist} onChange={handleChange} required />
        </label>

        <label>
          Observations
          <textarea name="observations" value={form.observations} onChange={handleChange} rows={4} />
        </label>

        <label>
          Plan
          <textarea name="plan" value={form.plan} onChange={handleChange} rows={4} />
        </label>

        <button type="submit">Submit OPEA Assessment</button>
      </form>
    </div>
  );
}