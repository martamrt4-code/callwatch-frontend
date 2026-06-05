import React from "react";
import { useQuery } from "@tanstack/react-query";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";

export default function DepartmanRiskTab() {
  const { data = {}, isLoading } = useQuery({
    queryKey: ["dept-risk"],
    queryFn: () => fetch('/api/department-risk',{credentials:'include'}).then(r=>r.json()),
    refetchInterval: 60000,
  });

  const departments = data.departments || [];

  const chartData = departments.map(d => ({
    name: d.department,
    risk: Math.round(d.avg_risk || 0),
    alarm: d.alarm_count || 0,
    pc: d.pc_count || 0,
  }));

  const getColor = (risk) => risk >= 80 ? '#ef4444' : risk >= 50 ? '#eab308' : '#22c55e';

  return (
    <div className="p-4 space-y-4">
      <div className="bg-card border border-border rounded-lg p-4">
        <h3 className="text-sm font-semibold text-foreground mb-4">🏢 Departman Bazlı Risk Haritası — {departments.length} departman</h3>
        {isLoading ? (
          <div className="text-center text-muted-foreground py-8 text-sm">Yükleniyor...</div>
        ) : departments.length === 0 ? (
          <div className="text-center text-muted-foreground py-8 text-sm">PC Yönetimi'nden departman atayın</div>
        ) : (
          <>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={chartData}>
                <XAxis dataKey="name" tick={{fontSize:11, fill:'#6b7280'}} />
                <YAxis tick={{fontSize:11, fill:'#6b7280'}} domain={[0,100]} />
                <Tooltip
                  contentStyle={{background:'#1a1f2e',border:'1px solid #2a3040',fontSize:12}}
                  formatter={(v,n) => [v, n==='risk'?'Risk Skoru':'Alarm']}
                />
                <Bar dataKey="risk" radius={[4,4,0,0]}>
                  {chartData.map((d,i) => <Cell key={i} fill={getColor(d.risk)} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            <div className="mt-4 space-y-2">
              {departments.map(d => (
                <div key={d.department} className="flex items-center justify-between p-3 bg-muted/20 rounded-lg">
                  <div>
                    <span className="text-sm font-medium text-foreground">{d.department}</span>
                    <span className="text-xs text-muted-foreground ml-2">{d.pc_count} PC</span>
                  </div>
                  <div className="flex items-center gap-4 text-xs">
                    <span className="text-muted-foreground">{d.alarm_count} alarm</span>
                    <span className="text-muted-foreground">{d.critical_count} kritik</span>
                    <span className={`font-mono font-bold ${d.avg_risk>=80?'text-destructive':d.avg_risk>=50?'text-yellow-400':'text-emerald-400'}`}>
                      {Math.round(d.avg_risk)}/100
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
