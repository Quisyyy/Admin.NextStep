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
    <div style="margin-top:24px;">
      <h4 style="margin-bottom:8px;">Related to Course (Bar Chart)</h4>
      <div style="display:flex;align-items:end;height:120px;gap:32px;">
        <div style="flex:1;text-align:center;">
          <div style="background:#4caf50;width:60px;height:${relPercent}px;margin:0 auto 8px auto;border-radius:6px;"></div>
          <div style="font-weight:bold;">Related</div>
          <div style="color:#555;">${related}</div>
        </div>
        <div style="flex:1;text-align:center;">
          <div style="background:#f44336;width:60px;height:${notRelPercent}px;margin:0 auto 8px auto;border-radius:6px;"></div>
          <div style="font-weight:bold;">Not Related</div>
          <div style="color:#555;">${notRelated}</div>
        </div>
      </div>
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
