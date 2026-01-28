// frontend/src/Components/ClusterTable.jsx
import React, { useEffect, useState } from "react";
import Table from "react-bootstrap/Table";
import Button from "react-bootstrap/Button";
import { getResponseGet } from "../lib/utils"; // adjust if your utils path differs

const ClusterTable = ({ courseId, topicId, onHighlightCluster }) => {
  const [loading, setLoading] = useState(false);
  const [clusters, setClusters] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    const load = async () => {
      if (!courseId || !topicId) {
        setClusters([]);
        return;
      }
      setLoading(true);
      setError(null);
      try {
        const resp = await getResponseGet(
          `/summary-clusters/${courseId}/${topicId}`
        );
        // your getResponseGet usually returns object with { data: ... }
        const data = resp?.data ?? resp;
        setClusters(data?.clusters ?? []);
      } catch (err) {
        console.error("Failed to load clusters", err);
        setError("Failed to load clusters (check backend /summary-clusters)");
        setClusters([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [courseId, topicId]);

  if (!topicId)
    return <div style={{ marginTop: 8 }}>Select a topic to view clusters.</div>;

  return (
    <div style={{ marginTop: 12 }}>
      <h5 style={{ marginBottom: 8 }}>Clusters for topic #{topicId}</h5>

      {loading && <div>Loading clusters…</div>}
      {error && <div style={{ color: "red" }}>{error}</div>}
      {!loading && clusters.length === 0 && !error && (
        <div>No clusters found for this topic yet.</div>
      )}

      {clusters.map((c) => (
        <div
          key={c.cluster_index}
          style={{
            marginBottom: 16,
            border: "1px solid #e7e7e7",
            padding: 10,
            borderRadius: 6,
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <div>
              <strong>Cluster {c.cluster_index}</strong>
              <div style={{ fontSize: 12, color: "#555" }}>
                centroid:{" "}
                {c.centroid_x !== null && c.centroid_y !== null
                  ? `${Number(c.centroid_x).toFixed(3)}, ${Number(
                      c.centroid_y
                    ).toFixed(3)}`
                  : "n/a"}
              </div>
            </div>

            <div>
              {onHighlightCluster && (
                <Button
                  size="sm"
                  variant="outline-primary"
                  onClick={() => onHighlightCluster(c)}
                  style={{ marginRight: 8 }}
                >
                  Highlight on map
                </Button>
              )}
            </div>
          </div>

          <div style={{ marginTop: 8 }}>
            <strong>Top keywords:</strong>{" "}
            {Array.isArray(c.top_keywords)
              ? c.top_keywords.join(", ")
              : String(c.top_keywords ?? "")}
          </div>

          <div style={{ marginTop: 8 }}>
            <Table size="sm" bordered hover>
              <thead>
                <tr>
                  <th>Enroll ID</th>
                  <th>Learner</th>
                  <th>Position (x, y)</th>
                </tr>
              </thead>
              <tbody>
                {c.learners && c.learners.length > 0 ? (
                  c.learners.map((l) => (
                    <tr key={l.enroll_id}>
                      <td>{l.enroll_id}</td>
                      <td>{l.learner_name ?? `enroll:${l.enroll_id}`}</td>
                      <td>
                        {l.x_coordinate !== null && l.y_coordinate !== null
                          ? `${Number(l.x_coordinate).toFixed(3)}, ${Number(
                              l.y_coordinate
                            ).toFixed(3)}`
                          : "-"}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="3">No learners in this cluster</td>
                  </tr>
                )}
              </tbody>
            </Table>
          </div>
        </div>
      ))}
    </div>
  );
};

export default ClusterTable;
