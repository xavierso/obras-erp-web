import React, { useState } from "react";
import { Button } from "@/components/ui/Button";
import { GlassCard } from "@/components/ui/GlassCard";
import { Dropdown } from "@/components/ui/Dropdown";
import { informesApi } from "@/lib/informesApi";

interface ModalInformeObraProps {
  obraId: number;
  obraCodigo: string;
  onClose: () => void;
}

export function ModalInformeObra({
  obraId,
  obraCodigo,
  onClose,
}: ModalInformeObraProps) {
  const [tipo, setTipo] = useState<
    "completo" | "semanal" | "mensual" | "personalizado"
  >("completo");
  const [fechaInicio, setFechaInicio] = useState("");
  const [fechaFin, setFechaFin] = useState("");
  const [generando, setGenerando] = useState(false);
  const [error, setError] = useState("");

  const handleGenerar = async () => {
    setGenerando(true);
    setError("");
    try {
      let params = {};
      const hoy = new Date();
      if (tipo === "semanal") {
        const haceUnaSemana = new Date(hoy);
        haceUnaSemana.setDate(hoy.getDate() - 7);
        params = {
          fecha_inicio: haceUnaSemana.toISOString(),
          fecha_fin: hoy.toISOString(),
        };
      } else if (tipo === "mensual") {
        const haceUnMes = new Date(hoy);
        haceUnMes.setMonth(hoy.getMonth() - 1);
        params = {
          fecha_inicio: haceUnMes.toISOString(),
          fecha_fin: hoy.toISOString(),
        };
      } else if (tipo === "personalizado") {
        if (!fechaInicio || !fechaFin) {
          setError("Debe seleccionar fecha de inicio y fin.");
          setGenerando(false);
          return;
        }
        params = {
          fecha_inicio: new Date(fechaInicio).toISOString(),
          fecha_fin: new Date(fechaFin).toISOString(),
        };
      }

      const blob = await informesApi.generar(obraId, params);
      informesApi.descargarBlob(blob, `informe_${obraCodigo}.pdf`);
      onClose();
    } catch (err: any) {
      setError(err.message || "Error al generar el informe");
    } finally {
      setGenerando(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-md">
        <GlassCard>
          <h2 className="text-xl font-bold text-text-main mb-4">
            Generar Informe de Obra
          </h2>

          <div className="space-y-4 mb-6">
            <div>
              <label className="block text-sm text-text-muted mb-2">
                Tipo de informe
              </label>
              <div className="relative z-20">
                <Dropdown
                  value={tipo}
                  onChange={(val) => setTipo(val as any)}
                  fullWidth
                  options={[
                    { value: "completo", label: "Completo (Todas las visitas)" },
                    { value: "semanal", label: "Semanal (Últimos 7 días)" },
                    { value: "mensual", label: "Mensual (Últimos 30 días)" },
                    { value: "personalizado", label: "Rango de fechas" }
                  ]}
                />
              </div>
            </div>

            {tipo === "personalizado" && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-text-muted mb-1">
                    Desde
                  </label>
                  <input
                    type="date"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-text-main focus:outline-none focus:border-accent [color-scheme:dark]"
                    value={fechaInicio}
                    onChange={(e) => setFechaInicio(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm text-text-muted mb-1">
                    Hasta
                  </label>
                  <input
                    type="date"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-text-main focus:outline-none focus:border-accent [color-scheme:dark]"
                    value={fechaFin}
                    onChange={(e) => setFechaFin(e.target.value)}
                  />
                </div>
              </div>
            )}

            {error && <div className="text-error text-sm">{error}</div>}
          </div>

          <div className="flex gap-4">
            <Button
              variant="outlined"
              className="flex-1"
              onClick={onClose}
              disabled={generando}
            >
              Cancelar
            </Button>
            <Button
              className="flex-1"
              onClick={handleGenerar}
              disabled={generando}
            >
              {generando ? "Generando..." : "Generar PDF"}
            </Button>
          </div>
        </GlassCard>
      </div>
    </div>
  );
}
