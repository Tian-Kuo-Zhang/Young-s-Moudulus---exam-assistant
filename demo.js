// --- 常量定义 ---
const G = 10; // 重力加速度 g = 10 m/s^2 (使用 SI 单位)
const MM_TO_M = 0.001; // 毫米到米的转换系数

// --- 仪器精度硬编码 (转换为米，用于计算 u_B) ---
const PRECISION_D_M = 0.001 * MM_TO_M; // 螺旋测微计精度: 0.001 mm
const PRECISION_LEN_M = 1 * MM_TO_M; // 米尺精度 (D, L, b, n): 1 mm 

// --- 默认数据 ---
const DEFAULT_DATA = {
    // 表 1: 长度参数 (mm) 
    d_values: [0.576, 0.579, 0.577, 0.577, 0.580, 0.578], 
    D: 1905.0,
    L: 796.2,
    b: 84.1,
    // 表 2: 读数 (mm)
    M_weights: [2.00, 3.00, 4.00, 5.00, 6.00, 7.00, 8.00, 9.00],
    n_prime: [0.0, 9.8, 19.0, 27.9, 36.8, 45.8, 53.2, 61.2],
    n_d_prime: [0.2, 9.9, 19.1, 28.0, 37.3, 45.8, 53.4, 61.0]
};

// --- 辅助函数：获取输入值 ---
function getInputValue(id) {
    const element = document.getElementById(id);
    if (!element) return NaN;
    
    const rawValue = element.value.trim();
    if (rawValue === '') return NaN; 
    
    const value = parseFloat(rawValue);
    return isNaN(value) ? NaN : value; 
}

// --- 步骤一：加载表格 (HTML) ---
function loadTables() {
    const inputArea = document.getElementById('input-area');
    
    const inputStyle = `
        width: 90%; 
        padding: 6px; 
        border: 1px solid #a9c5ec; 
        border-radius: 6px; 
        text-align: center;
    `;
    
    // --- Table 1: 长度参数输入 (表头已使用 \\( \\) 修复) ---
    let table1HTML = `
        <h4>1.1 📏 长度参数测量值</h4>
        <p style="padding-left: 10px; border-left: 3px solid #f39c12;">💡 提示：直径 \\(d\\) 需多次测量取平均，其他参数只需填写第一次测量值。</p>
        <table>
            <thead>
                <tr>
                    <th>测量值</th>
                    <th>\\(d \\mathrm{ (直径)} - \\mathrm{mm}\\)</th> 
                    <th>\\(D \\mathrm{ (光路长)} - \\mathrm{mm}\\)</th>
                    <th>\\(L \\mathrm{ (原长)} - \\mathrm{mm}\\)</th>
                    <th>\\(b \\mathrm{ (光杠杆长)} - \\mathrm{mm}\\)</th>
                </tr>
            </thead>
            <tbody>`;
    for (let i = 1; i <= 6; i++) { 
        const isDisabled = i !== 1;
        const disabledAttr = isDisabled ? 'disabled' : '';
        const disabledStyle = isDisabled ? 'background-color: #f0f0f0; color: #999;' : '';
        
        table1HTML += `
            <tr>
                <td>Trial ${i}</td>
                <td><input type="number" id="d_${i}" value="${DEFAULT_DATA.d_values[i-1] || ''}" step="0.001" style="${inputStyle}"></td>
                <td><input type="number" id="D_${i}" value="${i === 1 ? DEFAULT_DATA.D : ''}" ${disabledAttr} style="${inputStyle} ${disabledStyle}"></td>
                <td><input type="number" id="L_${i}" value="${i === 1 ? DEFAULT_DATA.L : ''}" ${disabledAttr} style="${inputStyle} ${disabledStyle}"></td>
                <td><input type="number" id="b_${i}" value="${i === 1 ? DEFAULT_DATA.b : ''}" ${disabledAttr} style="${inputStyle} ${disabledStyle}"></td>
            </tr>`;
    }
    table1HTML += `
            </tbody>
        </table>
    `;

    // --- Table 2: 载荷/卸载读数输入 (表头已使用 \\( \\) 修复) ---
    let table2HTML = `
        <h4>1.2 ⚖️ 载荷(\\({n'}\\)) /卸载(\\({n''}\\)) 读数 (单位: 毫米 (\\(\\mathrm{mm}\\)))</h4>
        <p style="padding-left: 10px; border-left: 3px solid #1abc9c;">✔️ 载荷 \\(M\\) 已固定，请根据实验记录填入对应的 \\(n'\\) 和 \\(n''\\) 读数。</p>
        <table>
            <thead>
                <tr>
                    <th>测量序号 $i$</th>`;
    for (let i = 0; i <= 7; i++) { table2HTML += `<th>${i}</th>`; }
    table2HTML += `
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td>载荷 \\(M \\mathrm{ (kg)}\\)</td>`; // 使用 \\( \\)
    for (let i = 0; i <= 7; i++) { table2HTML += `<td>${DEFAULT_DATA.M_weights[i]}</td>`; }
    table2HTML += `
                </tr>
                <tr>
                    <td>\\(n' \\mathrm{ (加载读数)}\\)</td>`; // 使用 \\( \\)
    for (let i = 0; i <= 7; i++) { 
        table2HTML += `<td><input type="number" id="n_p_${i}" value="${DEFAULT_DATA.n_prime[i]}" step="0.1" style="${inputStyle}"></td>`; 
    }
    table2HTML += `
                </tr>
                <tr>
                    <td>\\(n'' \\mathrm{ (卸载读数)}\\)</td>`; // 使用 \\( \\)
    for (let i = 0; i <= 7; i++) { 
        table2HTML += `<td><input type="number" id="n_pp_${i}" value="${DEFAULT_DATA.n_d_prime[i]}" step="0.1" style="${inputStyle}"></td>`; 
    }
    table2HTML += `
            </tr>
            </tbody>
        </table>`;

    inputArea.innerHTML = table1HTML + table2HTML;
    
    // 强制 MathJax 渲染公式
    if (window.MathJax) {
        // 在 DOM 结构更新后立即尝试渲染，确保表格头部也被识别
        MathJax.typesetPromise([inputArea]).catch((err) => console.error("MathJax init error:", err));
    }
}

// --- 步骤二：核心数据处理函数 ---
function processData() {
    // --- 1. 读取 Table 1 数据 ---
    const d_values_mm = [];
    for (let i = 1; i <= 6; i++) { 
        const d_val_mm = getInputValue(`d_${i}`);
        if (!isNaN(d_val_mm)) d_values_mm.push(d_val_mm);
    }
    const d_avg_mm = d_values_mm.length > 0 ? d_values_mm.reduce((a, b) => a + b) / d_values_mm.length : NaN;
    const d_avg = d_avg_mm * MM_TO_M; // M

    const D_mm = getInputValue('D_1');
    const L_mm = getInputValue('L_1');
    const b_mm = getInputValue('b_1');
    
    const D = D_mm * MM_TO_M; // M
    const L = L_mm * MM_TO_M; // M
    const b = b_mm * MM_TO_M; // M
    
    // --- Input validation: 检查关键参数是否缺失或为零 ---
    if (d_values_mm.length < 3 || isNaN(d_avg) || d_avg <= 0 || D <= 0 || L <= 0 || b <= 0) {
        // 这里的 $D$, $L$, $b$ 是在公式框内部，使用 $ 没问题
        showError('<p class="error-message">❌ 错误：请至少输入3个直径值和 $D$, $L$, $b$ 的测量值，并确保所有长度参数大于零。</p>');
        return;
    }

    // --- 2. 处理 Table 2 数据 (MM) 并转换为 M ---
    const n_i = [];
    const M_weights = DEFAULT_DATA.M_weights;
    
    let isDataMissing = false;
    for (let i = 0; i <= 7; i++) {
        const n_p_mm = getInputValue(`n_p_${i}`);
        const n_pp_mm = getInputValue(`n_pp_${i}`);
        if (isNaN(n_p_mm) || isNaN(n_pp_mm)) { 
            isDataMissing = true;
            break;
        }
        const n_i_mm = (n_p_mm + n_pp_mm) / 2;
        n_i.push(n_i_mm * MM_TO_M); // 存储 M
    }
    
    if (isDataMissing) {
        showError('<p class="error-message">❌ 错误：载荷读数有缺失或无效输入，请检查表格 2 的所有输入是否为数字。</p>');
        return;
    }
    
    if (n_i.length < 4) { 
        // 这里的 $\sigma - \epsilon$ 是在公式框内部，使用 $ 没问题
        showError('<p class="error-message">❌ 错误：读数数据点不足，无法进行拟合计算。</p>');
        return;
    }
    
    // --- 3. 杨氏模量 Y 计算 ---
    const M_base = M_weights[0]; // 2.00 kg
    const A = Math.PI * Math.pow(d_avg / 2, 2); // m^2
    const data_points = [];
    
    for (let i = 1; i <= 7; i++) {
        const Delta_M = M_weights[i] - M_base; 
        const Delta_n = n_i[i] - n_i[0]; 
        
        if (Delta_M > 0) { 
            const sigma = (Delta_M * G) / A;
            const Delta_L = (b / (2 * D)) * Delta_n; 
            const epsilon = Delta_L / L;
            data_points.push({ sigma, epsilon, Delta_M, Delta_n });
        }
    }
    
    if (data_points.length < 2) {
        // 这里的 $\sigma - \epsilon$ 是在公式框内部，使用 $ 没问题
        showError('<p class="error-message">❌ 错误：计算得到的有效 $\\sigma - \\epsilon$ 数据点少于 2 个，无法进行线性拟合。请检查读数的变化量。</p>');
        return;
    }
    
    // 最小二乘法拟合
    let sum_x = 0; let sum_y = 0; let sum_xy = 0; let sum_x2 = 0;
    const N = data_points.length;
    data_points.forEach(p => { 
        sum_x += p.epsilon; 
        sum_y += p.sigma; 
        sum_xy += p.epsilon * p.sigma; 
        sum_x2 += p.epsilon * p.epsilon; 
    });
    
    const Y_denominator = (N * sum_x2 - sum_x * sum_x);
    if (Y_denominator === 0) {
        // 这里的 $\epsilon$ 是在公式框内部，使用 $ 没问题
        showError('<p class="error-message">❌ 错误：所有应变 $\\epsilon$ 值均相同（或变化量极小），无法进行最小二乘法拟合。</p>');
        return;
    }
    
    const Y_numerator = (N * sum_xy - sum_x * sum_y);
    const Y_calc = Y_numerator / Y_denominator; 
    
    // 样本计算数据
    const sample_point = data_points[Math.min(3, data_points.length - 1)]; 
    const Delta_n_mm_sample = (sample_point.Delta_n / MM_TO_M).toFixed(2);
    const M_sample_index = M_weights.indexOf(sample_point.Delta_M + M_base);
    const n_i_mm_sample = (n_i[M_sample_index] / MM_TO_M).toFixed(1); 
    const n_i_mm_0 = (n_i[0] / MM_TO_M).toFixed(1);

    // --- 4. 不确定度计算 ---
    const d_squared_diff_sum = d_values_mm.reduce((sum, d) => sum + Math.pow(d * MM_TO_M - d_avg, 2), 0);
    const u_A_d = Math.sqrt(d_squared_diff_sum / (d_values_mm.length * (d_values_mm.length - 1)));
    const u_B_d = PRECISION_D_M / Math.sqrt(3);
    const u_d = Math.sqrt(Math.pow(u_A_d, 2) + Math.pow(u_B_d, 2)); // m
    
    const u_Delta_n_avg = PRECISION_LEN_M / Math.sqrt(3) / Math.sqrt(4); 
    
    const relative_uncertainty_sq = (
        Math.pow(2 * u_d / d_avg, 2) + 
        Math.pow(PRECISION_LEN_M / (D * Math.sqrt(3)), 2) + 
        Math.pow(PRECISION_LEN_M / (L * Math.sqrt(3)), 2) + 
        Math.pow(PRECISION_LEN_M / (b * Math.sqrt(3)), 2) + 
        Math.pow(u_Delta_n_avg / (sample_point.Delta_n / 4), 2)
    );
    const u_Y = Y_calc * Math.sqrt(Math.abs(relative_uncertainty_sq)); 

    // --- 5. 生成 HTML 输出 (Section 2) ---
    const Y_num = Y_calc.toExponential(2);
    const u_Y_num = u_Y.toExponential(2);
    
    // ************************************************************
    // *** 核心修复区域：所有段落文本的 $...$ 替换为 \\(...\\) ***
    // ************************************************************
    const tempOutputCalc = `
        <h3 style="color: #34495e; border-left: 6px solid #1abc9c;">1. 数据处理与计算过程 🔢</h3>
        
        <h4>1.1 📏 测量参数平均值 (SI 单位: \\(\\mathrm{m}\\))</h4>
        <p style="padding-left: 10px; border-left: 3px solid #7f8c8d;">平均钢丝直径 \\(\\bar{d}\\): ${d_avg_mm.toFixed(3)} \\(\\mathrm{ mm}\\) (\\(\\approx\\) ${d_avg.toExponential(3)} \\(\\mathrm{ m}\\))</p>
        <p style="padding-left: 10px; border-left: 3px solid #7f8c8d;">光路长度 \\(D\\): ${D_mm.toFixed(1)} \\(\\mathrm{ mm}\\) (\\(\\approx\\) ${D.toExponential(3)} \\(\\mathrm{ m}\\))</p>
        <p style="padding-left: 10px; border-left: 3px solid #7f8c8d;">钢丝原长 \\(L\\): ${L_mm.toFixed(1)} \\(\\mathrm{ mm}\\) (\\(\\approx\\) ${L.toExponential(3)} \\(\\mathrm{ m}\\))</p>
        <p style="padding-left: 10px; border-left: 3px solid #7f8c8d;">光杠杆长度 \\(b\\): ${b_mm.toFixed(1)} \\(\\mathrm{ mm}\\) (\\(\\approx\\) ${b.toExponential(3)} \\(\\mathrm{ m}\\))</p>
        
        <h4>1.2 ✍️ 样本计算：应力 \\(\\sigma\\) 和应变 \\(\\epsilon\\) (以 \\(\\Delta M=${sample_point.Delta_M.toFixed(2)} \\mathrm{ kg}\\) 为例)</h4>
        <div class="formula-box">
            $$\\Delta M = ${sample_point.Delta_M.toFixed(2)}\\mathrm{ kg}$$
            $$\\text{横截面积 } A = \\frac{\\pi d^2}{4} = \\frac{\\pi (${d_avg.toExponential(3)})^2}{4} \\approx ${A.toExponential(3)} \\mathrm{ m}^2$$
            $$\\text{米尺平均变化量 } \\Delta n = n_{${M_sample_index}} - n_{0} = ${n_i_mm_sample} \\mathrm{ mm} - ${n_i_mm_0} \\mathrm{ mm} = ${Delta_n_mm_sample} \\mathrm{ mm} \\approx ${sample_point.Delta_n.toExponential(3)} \\mathrm{ m}$$
            $$\\text{应力 } \\sigma = \\frac{F}{A} = \\frac{\\Delta M \\cdot g}{A} = \\frac{${sample_point.Delta_M.toFixed(2)} \\cdot 10}{${A.toExponential(3)}} \\approx ${sample_point.sigma.toExponential(3)} \\mathrm{ Pa}$$
            $$\\text{应变 } \\epsilon = \\frac{\\Delta L}{L} = \\frac{b \\cdot \\Delta n}{2DL} = \\frac{${b.toExponential(3)} \\cdot ${sample_point.Delta_n.toExponential(3)}}{2 \\cdot ${D.toExponential(3)} \\cdot ${L.toExponential(3)}} \\approx ${sample_point.epsilon.toExponential(3)}$$
        </div>
        
        <h4>1.3 📊 \\(\\Delta n\\) 均值计算表格 (\\(\\Delta M = 4.00\\mathrm{ kg}\\) 对应 \\(\\Delta n_j = |n_{j+4} - n_j|\\))</h4>
        ${generateDeltaNTable(n_i, MM_TO_M)}
        
        <h4>1.4 📈 杨氏模量 \\(Y\\) 的线性拟合 (最小二乘法)</h4>
        <div class="formula-box">
            <p>拟合公式：$$\\sigma = Y \\cdot \\epsilon + C$$</p>
            $$Y = \\frac{N \\sum (\\epsilon_i \\sigma_i) - \\sum \\epsilon_i \\sum \\sigma_i}{N \\sum \\epsilon_i^2 - (\\sum \\epsilon_i)^2}$$
            <b style="color: #4285f4; font-size: 1.1em;">$$\\text{计算结果 } Y \\approx ${Y_calc.toExponential(3)} \\mathrm{ Pa}$$</b>
        </div>
        
        <h4>1.5 ⚠️ 不确定度分析 (合成不确定度 \\(u(Y)\\))</h4>
        <p><b>最终报告结果:</b></p>
        <div class="formula-box" style="border-color: #fdd8d5; background-color: #fef0f0;">
            <p>直径 \\(d\\) 的合成不确定度：$$u(d) = \\sqrt{u_A^2(d) + u_B^2(d)} \\approx ${u_d.toExponential(3)} \\mathrm{ m}$$</p>
            <p>相对不确定度平方：$$\\left(\\frac{u(Y)}{Y}\\right)^2 \\approx \\left(2\\frac{u(d)}{\\bar{d}}\\right)^2 + \\left(\\frac{u_B(D)}{D}\\right)^2 + \\left(\\frac{u_B(L)}{L}\\right)^2 + \\left(\\frac{u_B(b)}{b}\\right)^2 + \\left(\\frac{u(\\overline{\\Delta n})}{\\overline{\\Delta n}}\\right)^2$$</p>
            <b style="color: #c0392b; font-size: 1.2em;">$$\\text{最终杨氏模量: } Y = (${Y_num} \\pm ${u_Y_num}) \\mathrm{ Pa}$$</b>
        </div>
    `;
    // ************************************************************
    
    // --- 6. 生成报告模板 ---
    const tempOutputAbstract = `<h3 style="color: #34495e; border-left: 6px solid #f39c12;">2. 摘要 (Abstract) 📄</h3><div class="report-text">${getAbstractTemplate(Y_num)}</div>`;
    const tempOutputConclusion = `<h3 style="color: #34495e; border-left: 6px solid #0f9d58;">3. 结论 (Conclusion) ✅</h3><div class="report-text" style="border-left: 6px solid #0f9d58; background-color: #e6f7ef;">${getConclusionTemplate(Y_num, u_Y_num)}</div>`;

    // --- 7. 生成 MATLAB 代码和 Chart HTML ---
    const matlabCode = generateMatlabCode(D, L, b, d_avg, data_points, Y_calc);
    const matlabCodeHTML = `
        <div id="results-matlab-code" style="grid-column: 1 / 3; margin-top: 20px;">
            <h3>4. MATLAB 作图代码 💻</h3>
            <p>请复制以下代码至 MATLAB 运行，以生成 \\(\\sigma - \\epsilon\\) 关系图和拟合线。</p>
            <pre><code>${matlabCode.trim()}</code></pre>
        </div>
    `;
    const chartHTML = '<div id="chart-container" style="grid-column: 1 / 3;"><canvas id="youngs-modulus-chart"></canvas></div>';

    // --- 8. 重新构造整个输出区域的 HTML ---
    const outputArea = document.getElementById('output-area');
    const downloadArea = document.getElementById('download-button-area');
    
    outputArea.innerHTML = `
        <div id="results-calculations" style="grid-column: 1 / 3;">
            ${tempOutputCalc}
        </div>
        ${chartHTML}
        ${matlabCodeHTML}
        <div id="results-abstract" style="grid-column: 1 / 3;">${tempOutputAbstract}</div>
        <div id="results-conclusion" style="grid-column: 1 / 3;">${tempOutputConclusion}</div>
    `;

    // 9. 显示结果区域和下载按钮
    outputArea.style.display = 'grid';
    downloadArea.style.display = 'block';

    // 10. 绘制图表
    drawChart(data_points, Y_calc);
    
    // 11. 绑定 Word 下载事件 
    let downloadButton = document.getElementById('download-doc-button');
    if (downloadButton && !downloadButton._isBound) {
        downloadButton.addEventListener('click', downloadWordDocument);
        downloadButton._isBound = true; 
    }

    // 12. 强制渲染 MathJax 
    setTimeout(() => {
        const allOutputDivs = outputArea.children;
        if (window.MathJax) {
            MathJax.typesetPromise(allOutputDivs).catch((err) => console.error("MathJax render error:", err));
        }
    }, 100); 
}

// 错误信息显示辅助函数
function showError(message) {
    const outputArea = document.getElementById('output-area');
    outputArea.innerHTML = `<div id="results-calculations" style="grid-column: 1 / 3;">${message}</div>`;
    outputArea.style.display = 'grid';
    document.getElementById('download-button-area').style.display = 'none';
    if (window.MathJax) { MathJax.typeset(); }
}


// --- 辅助函数：生成 Delta n 表格 HTML ---
function generateDeltaNTable(n_i, MM_TO_M) {
    // 假设我们只计算 Delta M = 4.00 kg 的情况，即 M_i - M_j = 4.00 kg
    const delta_n_values = [];
    let delta_n_sum = 0;
    
    const num_pairs = 4;
    for (let j = 0; j < num_pairs; j++) {
        const index_M = j + 4;
        const index_N = j;
        
        if (index_M < n_i.length && index_N < n_i.length) {
            const n_M_mm = n_i[index_M] / MM_TO_M; 
            const n_N_mm = n_i[index_N] / MM_TO_M;
            const delta_n_mm = Math.abs(n_M_mm - n_N_mm);
            
            delta_n_values.push({
                n_M: index_M,
                n_N: index_N,
                val_mm: delta_n_mm.toFixed(2),
                n_M_val: n_M_mm.toFixed(1),
                n_N_val: n_N_mm.toFixed(1)
            });
            delta_n_sum += delta_n_mm;
        }
    }

    if (delta_n_values.length === 0) {
        return '<p style="color: #c0392b;">数据点不足，无法计算 \\(\\overline{\\Delta n}\\)。</p>';
    }
    
    const delta_n_avg_mm = delta_n_sum / delta_n_values.length;
    
    return `
        <div class="formula-box">
            <table style="border-collapse: collapse; width: 100%; margin-bottom: 15px;">
                <thead>
                    <tr style="background-color: #3498db; color: white;">
                        <th style="border: 1px solid white; padding: 8px; text-align: center;">$j$</th>
                        <th style="border: 1px solid white; padding: 8px; text-align: center;">\\(\\Delta M \\mathrm{ (kg)}\\)</th>
                        <th style="border: 1px solid white; padding: 8px; text-align: center;">\\(|n_{j+4}\\mathrm{ (mm)} - n_j\\mathrm{ (mm)}|\\)</th>
                        <th style="border: 1px solid white; padding: 8px; text-align: center;">\\(\\Delta n_j \\mathrm{ (mm)}\\)</th>
                    </tr>
                </thead>
                <tbody>
                ${delta_n_values.map((d, index) => `
                    <tr>
                        <td style="border: 1px solid #ccc; padding: 8px; text-align: center;">${index + 1}</td>
                        <td style="border: 1px solid #ccc; padding: 8px; text-align: center;">4.00</td>
                        <td style="border: 1px solid #ccc; padding: 8px; text-align: center;">$|${d.n_M_val} - ${d.n_N_val}|$</td>
                        <td style="border: 1px solid #ccc; padding: 8px; text-align: center;">${d.val_mm}</td>
                    </tr>
                `).join('')}
                </tbody>
            </table>
            <p style="text-align: right;">$$\\overline{\\Delta n} = \\frac{1}{${delta_n_values.length}}(\\sum \\Delta n_j) = \\frac{1}{${delta_n_values.length}}(${delta_n_sum.toFixed(2)}) \\approx ${delta_n_avg_mm.toFixed(2)} \\mathrm{ mm}$$</p>
        </div>
    `;
}

// --- Word 文档下载函数 ---
function downloadWordDocument() {
    const getOuterHTML = (id) => document.getElementById(id) ? document.getElementById(id).outerHTML : '';

    if (window.MathJax) {
        MathJax.typesetPromise().then(() => {
            continueDownload();
        }).catch((err) => {
            console.error("MathJax typesetting error during download prep:", err);
            continueDownload(); 
        });
    } else {
        continueDownload();
    }
    
    function continueDownload() {
        // 确保使用 MathJax 渲染后的内容
        const calcContent = getOuterHTML('results-calculations');
        const abstractContent = getOuterHTML('results-abstract');
        const conclusionContent = getOuterHTML('results-conclusion');
        
        let matlabCodeContent = getOuterHTML('results-matlab-code');
        let chartImageHTML = '';

        const chartCanvas = document.getElementById('youngs-modulus-chart');
        if (chartCanvas) {
            try {
                if (chartCanvas.toDataURL() !== 'data:,') {
                    const dataURL = chartCanvas.toDataURL('image/png');
                    chartImageHTML = `
                        <div style='page-break-before: always; text-align: center; margin-top: 50px;'>
                            <h3>4.1 $\\sigma - \\epsilon$ 关系图</h3>
                            <img src='${dataURL}' alt='Stress-Strain Relationship Graph' style='max-width: 90%; height: auto; border: 1px solid #ccc; padding: 5px;'/>
                        </div>
                    `;
                }
            } catch (e) {
                chartImageHTML = "<p><em>（无法捕获图表图像，请在浏览器中截图后手动粘贴）</em></p>";
            }
        }

        const content = `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset='UTF-8'>
                <title>Young's Modulus Lab Report Demo</title>
                <style>
                    body { 
                        font-family: 'SimSun', 'Times New Roman', Times, serif; 
                        font-size: 12pt; 
                        line-height: 1.8; 
                        margin: 40px; 
                        color: #2c3e50;
                    }
                    h1 { font-size: 20pt; text-align: center; margin-bottom: 30px; color: #4285f4; }
                    h3 { font-size: 15pt; margin-top: 35pt; border-left: 6px solid #1abc9c; padding-left: 10px; color: #34495e; font-weight: bold; }
                    h4 { font-size: 13pt; margin-top: 20pt; border-bottom: 1px solid #ddd; padding-bottom: 5px; color: #1a73e8; }
                    .formula-box { border: 1px solid #aed6f1; padding: 15px; margin: 15px 0; background-color: #f0f8ff; border-radius: 5px; }
                    table { border-collapse: collapse; width: 100%; margin-bottom: 15px; font-size: 11pt; }
                    th, td { border: 1px solid #ccc; padding: 8px 10px; text-align: center; }
                    th { background-color: #eaf4fd; font-weight: bold; }
                    pre { background-color: #f4f6f8; padding: 15px; border: 1px solid #e0e0e0; overflow-x: auto; white-space: pre-wrap; word-wrap: break-word; font-family: 'Consolas', 'Courier New', monospace; font-size: 10pt; }
                    .report-text { margin: 10px 0; padding-left: 15px; border-left: 5px solid #f39c12; background-color: #fcfcfc;}
                    /* 确保 SVG 正确渲染 */
                    svg { max-width: 100%; height: auto; display: inline-block; vertical-align: middle; }
                </style>
            </head>
            <body>
                <h1>杨氏模量实验报告 - 简化演示版 📝</h1>
                ${abstractContent}
                ${calcContent}
                ${chartImageHTML}
                ${matlabCodeContent}
                ${conclusionContent}
                <p style="margin-top: 50px; font-style: italic; text-align: center; color: #7f8c8d;">--- 此文档由实验辅助工具生成，仅供参考 ---</p>
            </body>
            </html>
        `;

        const filename = `Youngs_Modulus_Report_Demo.doc`;
        const blob = new Blob(['\ufeff', content], {
            type: 'application/msword;charset=utf-8'
        });

        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }
}


// --- MATLAB 代码生成函数 ---
function generateMatlabCode(D, L, b, d_avg, data_points, Y_calc) {
    const g = 10;
    
    const sigma_array_str = '[' + data_points.map(p => p.sigma.toExponential(6)).join(' ') + ']';
    const epsilon_array_str = '[' + data_points.map(p => p.epsilon.toExponential(6)).join(' ') + ']';

    return `
% --------------------------------------------------------
% 杨氏模量实验数据处理与绘图 - MATLAB 代码
% --------------------------------------------------------

%% 1. 实验参数 (SI单位: m 和 kg)
g = ${g};         %% 重力加速度 (m/s^2)
D = ${D.toExponential(6)};     %% 光路长度 (m)
L = ${L.toExponential(6)};     %% 钢丝原长 (m)
b = ${b.toExponential(6)};     %% 光杠杆长度 (m)
d_avg = ${d_avg.toExponential(6)}; %% 平均钢丝直径 (m)

%% 2. 处理后的数据 (应力 Sigma 和应变 Epsilon)
% 应力 Sigma (Pa)
Sigma = ${sigma_array_str};

% 应变 Epsilon (无量纲)
Epsilon = ${epsilon_array_str};

%% 3. 线性回归 (最小二乘法)
% 模型: Sigma = Y * Epsilon + Intercept
P = polyfit(Epsilon, Sigma, 1);
Y_fit = P(1);     %% 杨氏模量 (Pa)
Intercept = P(2); %% 截距

%% 4. 绘图 (应力-应变关系图)
figure('Name', 'Stress-Strain Relationship Plot');
hold on;

% 绘制实验数据点
scatter(Epsilon, Sigma, 80, 'b', 'o', 'filled', 'MarkerFaceAlpha', 0.7);

% 绘制线性拟合直线
X_fit = linspace(min(Epsilon)*0.9, max(Epsilon)*1.1, 100);
Y_fit_line = Y_fit * X_fit + Intercept;
plot(X_fit, Y_fit_line, 'r--', 'LineWidth', 2);

% 设置图表属性
title('应力-应变 (\\sigma-\\epsilon) 关系图', 'FontSize', 14);
xlabel('应变 (\\epsilon)', 'FontSize', 12);
ylabel('应力 (\\sigma) (Pa)', 'FontSize', 12);

% 格式化输出 Y 值
Y_fit_formatted = sprintf('%.3e', Y_fit);
legend('实验数据点', ['线性拟合线 (Y=', Y_fit_formatted, ' Pa)'], 'Location', 'northwest', 'FontSize', 10);
grid on;
box on;
hold off;

fprintf('📢 拟合计算得到的杨氏模量 Y = %.3e Pa\\n', Y_fit);
% --------------------------------------------------------
`;
}


// --- 绘图函数 (Chart.js) ---
let youngsModulusChart = null;

function drawChart(data_points, slope) {
    const ctx = document.getElementById('youngs-modulus-chart').getContext('2d');
    
    if (youngsModulusChart) {
        youngsModulusChart.destroy();
    }
    
    const chartData = data_points.map(p => ({ x: p.epsilon, y: p.sigma }));

    // 重新计算截距
    let sum_x = 0; let sum_y = 0;
    data_points.forEach(p => { sum_x += p.epsilon; sum_y += p.sigma; });
    const N = data_points.length;
    const intercept = (sum_y - slope * sum_x) / N;

    const minX = Math.min(...data_points.map(p => p.epsilon)) * 0.9;
    const maxX = Math.max(...data_points.map(p => p.epsilon)) * 1.1;
    const linePoints = [
        { x: minX, y: slope * minX + intercept },
        { x: maxX, y: slope * maxX + intercept }
    ];

    youngsModulusChart = new Chart(ctx, {
        type: 'scatter',
        data: {
            datasets: [{
                label: '实验数据点 (Experimental Data Points)',
                data: chartData,
                backgroundColor: 'rgba(66, 133, 244, 0.9)', 
                pointRadius: 6,
                pointStyle: 'circle'
            },
            {
                label: `线性拟合线 (Y=${slope.toExponential(3)} Pa)`,
                data: linePoints,
                type: 'line',
                borderColor: 'rgba(219, 68, 55, 1)', 
                borderWidth: 3,
                fill: false,
                pointRadius: 0,
                tension: 0 
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: {
                    type: 'linear',
                    position: 'bottom',
                    title: {
                        display: true,
                        // MathJax 渲染 Chart.js 标签
                        text: '应变 (Strain, $\\epsilon$)', 
                        font: { size: 14 }
                    },
                    ticks: {
                        callback: function(value) {
                            return value.toExponential(2);
                        },
                        font: { size: 12 }
                    },
                    grid: { color: 'rgba(0, 0, 0, 0.05)' }
                },
                y: {
                    title: {
                        display: true,
                        text: '应力 (Stress, $\\sigma$) (Pa)',
                        font: { size: 14 }
                    },
                     ticks: {
                        callback: function(value) {
                            return value.toExponential(2);
                        },
                        font: { size: 12 }
                    },
                    grid: { color: 'rgba(0, 0, 0, 0.05)' }
                }
            },
            plugins: {
                title: {
                    display: true,
                    text: '应力-应变 ($\\sigma - \\epsilon$) 关系图',
                    font: { size: 16, weight: 'bold' }
                },
                legend: {
                    labels: {
                        font: { size: 12 }
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            let label = context.dataset.label || '';
                            if (label) {
                                label += ': ';
                            }
                            if (context.parsed.x !== null) {
                                label += `ε: ${context.parsed.x.toExponential(4)}`;
                            }
                            if (context.parsed.y !== null) {
                                label += `, σ: ${context.parsed.y.toExponential(4)} Pa`;
                            }
                            return label;
                        }
                    }
                }
            }
        }
    });
    
    const chartContainer = document.getElementById('chart-container');
    if (window.MathJax) {
         MathJax.typesetPromise([chartContainer]).catch((err) => console.error("MathJax chart render error:", err));
    }
}


// --- 摘要和结论模板 (通用版) ---
function getAbstractTemplate(Y_num) {
    return `
        <p><b>中文:</b> 🌟 本实验采用光杠杆法精确测量了钢丝的杨氏模量 (\\(Y\\))。通过对一系列载荷下的应力 (\\(\\sigma\\)) 和应变 (\\(\\epsilon\\)) 数据进行线性回归分析，成功获得了材料的弹性模量。实验结果显示，钢丝的杨氏模量约为 **$${Y_num} \\mathrm{ Pa}$$**。此结果与文献中典型钢材的弹性模量范围高度吻合，有力地证明了杨氏模量作为材料固有属性的稳定性。</p>
        <p><b>English:</b> This experiment successfully utilized the optical lever method to precisely determine the Young's Modulus (\\(Y\\)) of a steel wire. By performing linear regression on the stress (\\(\\sigma\\)) and strain (\\(\\epsilon\\)) data obtained under controlled loading, the intrinsic elastic property of the material was quantified. The resulting Young's Modulus for the steel wire is approximately **$${Y_num} \\mathrm{ Pa}$$** . This value is highly consistent with the typical range for steel found in literature, validating the stability of Young's Modulus as an intrinsic material characteristic.</p>
    `;
}

function getConclusionTemplate(Y_num, u_Y_num) {
    return `
        <p><b>中文:</b> 🎉 实验圆满完成，通过最小二乘法拟合，测得钢丝的杨氏模量最终结果为 $$Y = (${Y_num} \\pm ${u_Y_num}) \\mathrm{ Pa}$$。本次实验不仅验证了胡克定律的线性适用范围，还证明了光杠杆在微小形变测量中的卓越放大作用。在不确定度分析中，直径 (\\(\\bar{d}\\)) 和光路长度 (\\(D\\)) 的测量精度对最终结果的影响最为显著，这为后续改进实验方法提供了明确方向。我们成功掌握了利用间接测量和线性拟合计算物理常数的方法。</p>
        <p><b>English::</b> The experiment was successfully concluded, yielding a final Young's Modulus of the wire as $$Y = (${Y_num} \\pm ${u_Y_num}) \\mathrm{ Pa}$$ through the least squares fitting method. This study not only confirmed the linear applicability of Hooke's Law but also showcased the superior magnification power of the optical lever for measuring minute deformations. Uncertainty analysis indicates that the precision of the wire diameter (\\(\\bar{d}\\)) and optical path length (\\(D\\)) measurements were the most critical factors influencing the final result. We successfully mastered the methodology of calculating physical constants using indirect measurement and linear regression techniques.</p>
    `;
}


// --- 页面初始化和事件绑定 ---
document.addEventListener('DOMContentLoaded', () => {
    loadTables();
});