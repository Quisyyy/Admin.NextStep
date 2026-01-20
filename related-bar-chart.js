async function renderRelatedBarChart() {
  const chartContainer = document.getElementById("relatedBarChart");
  if (!chartContainer) return;
  chartContainer.innerHTML = '<div class="status-placeholder">Loading...</div>';

  const { data, error } = await window.supabase
    .from("alumni_profiles")
    .select("is_related")
    .eq("is_archived", false)
    .eq("is_deleted", false);

  if (error) {
    chartContainer.innerHTML =
      '<div class="status-placeholder">Error loading data</div>';
    return;
  }

  let related = 0,
    notRelated = 0;
  data.forEach((row) => {
    if (row.is_related === true) related++;
    else notRelated++;
  });

  const total = related + notRelated;
  const relPercent = total ? (related / total) * 100 : 0;
  const notRelPercent = total ? (notRelated / total) * 100 : 0;

  chartContainer.innerHTML = `
    <div style="margin-top:24px; padding:20px; background:#fff; border-radius:12px; box-shadow:0 2px 8px rgba(0,0,0,0.1);">
      <h4 style="margin-bottom:20px; color:#2c3e50; font-size:18px; font-weight:600; text-align:center;">Related to Course (Bar Chart)</h4>
      <div style="display:flex; align-items:end; height:160px; gap:40px; padding:0 20px; background:linear-gradient(to top, #f8f9fa 0%, transparent 100%); border-radius:8px;">
        <div style="flex:1; text-align:center;">
          <div style="background:linear-gradient(135deg, #4caf50, #45a049); width:80px; height:${Math.max(relPercent * 1.2, 8)}px; margin:0 auto 12px auto; border-radius:8px; box-shadow:0 4px 12px rgba(76,175,80,0.3); transition:all 0.3s ease;"></div>
          <div style="font-weight:600; color:#2c3e50; margin-bottom:4px;">Related</div>
          <div style="color:#7f8c8d; font-size:14px; background:#e8f5e8; padding:4px 12px; border-radius:20px; display:inline-block;">${related}</div>
        </div>
        <div style="flex:1; text-align:center;">
          <div style="background:linear-gradient(135deg, #f44336, #d32f2f); width:80px; height:${Math.max(notRelPercent * 1.2, 8)}px; margin:0 auto 12px auto; border-radius:8px; box-shadow:0 4px 12px rgba(244,67,54,0.3); transition:all 0.3s ease;"></div>
          <div style="font-weight:600; color:#2c3e50; margin-bottom:4px;">Not Related</div>
          <div style="color:#7f8c8d; font-size:14px; background:#ffeaea; padding:4px 12px; border-radius:20px; display:inline-block;">${notRelated}</div>
        </div>
      </div>
      <div style="margin-top:16px; text-align:center; color:#7f8c8d; font-size:13px;">Total Alumni: ${total}</div>
    </div>
  `;
}

async function waitForSupabaseAndRenderBarChart(retries = 20, delay = 200) {
  for (let i = 0; i < retries; i++) {
    if (window.supabase && typeof window.supabase.from === "function") {
      await renderRelatedBarChart();
      return;
    }
    await new Promise((r) => setTimeout(r, delay));
  }
  const chartContainer = document.getElementById("relatedBarChart");
  if (chartContainer)
    chartContainer.innerHTML =
      '<div class="status-placeholder">Supabase not ready</div>';
}

document.addEventListener("DOMContentLoaded", () => {
  waitForSupabaseAndRenderBarChart();
});
