import { Link } from "react-router-dom";

function Home() {
  return (
    <div className="page home">
      <h2>Welcome to CogFun ADHD Tools</h2>
      <p>Select a form from the navigation above to get started.</p>
      <div className="card-grid">
        <Link to="/aaa" className="card">
          <h3>AAA Assessment</h3>
          <p>Attention, Activity & Arousal evaluation form</p>
        </Link>
        <Link to="/opea" className="card">
          <h3>OPEA Assessment</h3>
          <p>Occupational Performance & Executive function assessment</p>
        </Link>
        <Link to="/results" className="card">
          <h3>Results</h3>
          <p>View all submitted assessments</p>
        </Link>
      </div>
    </div>
  );
}

export default Home;