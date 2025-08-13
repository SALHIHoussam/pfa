import { useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import axios from "axios";

export default function PresenceConfirm() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    const reunion_id = searchParams.get("reunion_id");
    const user_id = searchParams.get("user_id");

    if (!reunion_id || !user_id) {
      alert("Paramètres manquants");
      navigate("/login"); // ou page d’erreur
      return;
    }

    // Appel backend pour enregistrer présence
    axios
      .get(
        `http://localhost:5000/api/reunion/${reunion_id}/presence_link?user_id=${user_id}`
      )
      .then((res) => {
        alert(res.data.message || "Présence confirmée");

        // Récupérer le rôle utilisateur (stocké dans le frontend)
        const userRole = localStorage.getItem("userRole"); // exemple

        // Redirection selon rôle
        if (userRole === "ADMIN") navigate("/admin-home");
        else if (userRole === "AGENT_PKI") navigate("/agent-pki-home");
        else if (userRole === "PARTICIPANT") navigate("/participant-home");
        else if (userRole === "VERIFICATEUR") navigate("/verificateur-home");
        else navigate("/login");
      })
      .catch((err) => {
        alert(err.response?.data?.error || "Erreur lors de la confirmation");
        navigate("/login");
      });
  }, [searchParams, navigate]);

  return <div>Confirmation de présence en cours...</div>;
}
