

import { useState } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';

const useSPCAnalysis = (apiUrl) => {
  const [showSPCModal, setShowSPCModal] = useState(false);
  const [spcData, setSpcData] = useState(null);
  const [selectedCheckpoint, setSelectedCheckpoint] = useState(null);
  const [selectedInspection, setSelectedInspection] = useState(null);
  const [loading, setLoading] = useState(false);
  const [historyData, setHistoryData] = useState([]);

  const fetchSPCData = async (inspectionId, checkpointId) => {
    try {
      setLoading(true);
      const response = await axios.get(
        `${apiUrl}/qc-inspection/${inspectionId}/spc/checkpoint/${encodeURIComponent(checkpointId)}`,
        { withCredentials: true }
      );
      
      if (response.data.success) {
        setSpcData(response.data.data);
        setSelectedCheckpoint(checkpointId);
        setSelectedInspection(inspectionId);
        setShowSPCModal(true);
        toast.success(`SPC analysis loaded for ${checkpointId}`);
        return response.data.data;
      } else {
        toast.error(response.data.message || "Failed to load SPC data");
        return null;
      }
    } catch (error) {
      console.error("Error loading SPC data:", error);
      toast.error(error.response?.data?.message || "Failed to load SPC data");
      return null;
    } finally {
      setLoading(false);
    }
  };

  const fetchSPCHistory = async (itemId, checkpointName, processId = null) => {
    try {
      setLoading(true);
      const url = processId 
        ? `${apiUrl}/qc-inspection/spc/checkpoint/${itemId}/${encodeURIComponent(checkpointName)}?processId=${processId}&limit=50`
        : `${apiUrl}/qc-inspection/spc/checkpoint/${itemId}/${encodeURIComponent(checkpointName)}?limit=50`;
      
      const response = await axios.get(url, { withCredentials: true });
      
      if (response.data.success) {
        setHistoryData(response.data.data);
        toast.success(`Loaded ${response.data.data.length} inspection records for ${checkpointName}`);
        return response.data.data;
      } else {
        toast.error(response.data.message || "Failed to load SPC history");
        return [];
      }
    } catch (error) {
      console.error("Error loading SPC history:", error);
      toast.error(error.response?.data?.message || "Failed to load SPC history");
      return [];
    } finally {
      setLoading(false);
    }
  };

  const buildSPCFromMeasurements = (pieceMeasurements, checkpointId) => {
    if (!pieceMeasurements || pieceMeasurements.length === 0) {
      toast.error("No piece measurements available");
      return null;
    }

    const values = [];
    const numericValues = [];
    let expectedValue = "";
    let unitValue = "mm";
    let toleranceValue = "±0.1";

    pieceMeasurements.forEach((piece) => {
      const meas = piece.measurements?.[checkpointId];
      if (meas && meas.measured !== undefined && meas.measured !== "") {
        const value = parseFloat(meas.measured);
        if (!isNaN(value)) {
          expectedValue = meas.expected || "";
          unitValue = meas.unit || "mm";
          toleranceValue = meas.tolerance || "±0.1";
          numericValues.push(value);
          values.push({
            pieceNumber: piece.pieceNumber,
            value: meas.measured,
            pass: Math.abs(value - parseFloat(expectedValue || 0)) <= 
                  parseFloat(toleranceValue?.replace(/[^0-9.]/g, "") || 0.1),
            deviation: (value - parseFloat(expectedValue || 0)).toFixed(3),
          });
        }
      }
    });

    if (values.length === 0) {
      toast.error("No valid measurements found for this checkpoint");
      return null;
    }

    const avg = numericValues.reduce((a, b) => a + b, 0) / numericValues.length;
    const min = Math.min(...numericValues);
    const max = Math.max(...numericValues);
    const squaredDiffs = numericValues.map(v => Math.pow(v - avg, 2));
    const variance = squaredDiffs.reduce((a, b) => a + b, 0) / (values.length - 1);
    const stdDev = Math.sqrt(variance);

    const spcData = {
      checkpointId: checkpointId,
      checkpointName: checkpointId,
      expected: expectedValue,
      unit: unitValue,
      tolerance: toleranceValue,
      pieceValues: values,
      statistics: {
        sampleSize: values.length,
        mean: avg,
        min: min,
        max: max,
        range: max - min,
        stdDev: stdDev,
      },
    };

    setSpcData(spcData);
    setSelectedCheckpoint(checkpointId);
    setShowSPCModal(true);
    return spcData;
  };

  const closeModal = () => {
    setShowSPCModal(false);
    setSpcData(null);
  };

  return {
    showSPCModal,
    spcData,
    selectedCheckpoint,
    selectedInspection,
    loading,
    historyData,
    fetchSPCData,
    fetchSPCHistory,
    buildSPCFromMeasurements,
    closeModal,
    setShowSPCModal,
  };
};

export default useSPCAnalysis;