import { useEffect, useState } from "react";
import { db } from "../firebase";
import { ref, onValue } from "firebase/database";

function Results() {
  const [aaaData, setAaaData] = useState([]);
  const [opeaData, setOpeaData] = useState([]);
  const [tab, setTab] = useState("aaa");

  useEffect(() => {
    const u1 = onValue(ref(db,"aaa-submissions"),(s)=>{ const r=s.val(); setAaaData(r?Object.entries(r).map(([id,v])=>({id,...v})):[]); });
    const u2 = onValue(ref(db,"opea-submissions"),(s)=>{ const r=s.val(); setOpeaData(r?Object.entries(r).map(([id,v])=>({id,...v})):[]); });
    return ()=>{ u1(); u2(); };
  }, []);

  const data = tab==="aaa" ? aaaData : opeaData;

  return (
    <div className="page">
      <h2>Assessment Results</h2>
      <div className="tab-bar">
        <button className={tab==="aaa"?"active":""} onClick={()=>setTab("aaa")}>AAA ({aaaData.length})</button>
        <button className={tab==="opea"?"active":""} onClick={()=>setTab("opea")}>OPEA ({opeaData.length})</button>
      </div>
      {data.length===0 ? <p>No submissions yet.</p> : (
        <div className="results-list">
          {data.map(entry=>(
            <div key={entry.id} className="result-card">
              <div className="result-header">
                <strong>{entry.clientName}</strong>
                <span>{entry.date}</span>
                <span className="therapist">{entry.therapist}</span>
              </div>
              <div className="result-body">
                {Object.entries(entry).filter(([k])=>!["id","clientName","date","therapist","timestamp"].includes(k)).map(([k,v])=><p key={k}><strong>{k}:</strong> {v}</p>)}
              </div>
              <small className="timestamp">{new Date(entry.timestamp).toLocaleString()}</small>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default Results;