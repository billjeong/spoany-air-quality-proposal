// ============================================================================
// Spoany Autonomous Air Quality Control System Web Application Script
// ============================================================================

document.addEventListener('DOMContentLoaded', () => {

  // ==========================================
  // [설정] 클라이언트 사이드 비밀번호 게이트
  // *주의: 이 게이트는 클라이언트 사이드에서 작동하므로 완전한 보안이 아니며,
  // 외부인의 단순 접근을 차단하기 위한 용도입니다. 비밀번호는 평문으로 저장됩니다.
  // ==========================================
  const GATE_CONFIG = {
    PASSWORD: "4342",
    SESSION_KEY: "spoany_proposal_auth"
  };

  function initPasswordGate() {
    const savedAuth = sessionStorage.getItem(GATE_CONFIG.SESSION_KEY);
    const gateEl = document.getElementById('password-gate');
    const passwordInput = document.getElementById('gate-password-input');
    const errorMsg = document.getElementById('gate-error-msg');
    
    if (savedAuth === 'true') {
      document.body.classList.add('authorized');
      if (gateEl) gateEl.remove();
      return;
    }
    
    document.body.classList.remove('authorized');
    
    if (passwordInput) {
      // Focus the input window
      setTimeout(() => passwordInput.focus(), 100);
      
      passwordInput.addEventListener('input', (e) => {
        const val = e.target.value;
        if (val.length === 4) {
          verifyPassword(val);
        }
      });
      
      passwordInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          verifyPassword(passwordInput.value);
        }
      });
    }
    
    function verifyPassword(inputVal) {
      if (inputVal === GATE_CONFIG.PASSWORD) {
        sessionStorage.setItem(GATE_CONFIG.SESSION_KEY, 'true');
        document.body.classList.add('authorized');
        
        if (gateEl) {
          gateEl.style.opacity = '0';
          gateEl.style.transition = 'opacity 0.3s ease';
          setTimeout(() => gateEl.remove(), 300);
        }
        
        // Vercel Analytics Custom Event Tracking
        trackUnlockEvent();
      } else {
        if (passwordInput) {
          passwordInput.value = '';
          passwordInput.classList.add('shake');
          setTimeout(() => passwordInput.classList.remove('shake'), 400);
          passwordInput.focus();
        }
        if (errorMsg) {
          errorMsg.textContent = '비밀번호가 올바르지 않습니다. 다시 입력해주세요.';
          errorMsg.style.display = 'block';
        }
      }
    }
  }

  function trackUnlockEvent() {
    try {
      window.va = window.va || function () { (window.vaq = window.vaq || []).push(arguments); };
      const urlParams = new URLSearchParams(window.location.search);
      const utmSource = urlParams.get('utm_source');
      const eventData = utmSource ? { source: utmSource } : undefined;
      
      window.va('event', { name: 'proposal_unlocked', data: eventData });
      console.log('[Vercel Web Analytics] event proposal_unlocked tracked.', eventData);
    } catch (err) {
      console.error('[Vercel Web Analytics] Failed to track event:', err);
    }
  }

  // Initialize Password Gate
  initPasswordGate();

  // --------------------------------------------------------------------------
  // 1. Navigation & Slide Deck Controller
  // --------------------------------------------------------------------------
  let currentSlide = 1;
  const totalSlides = 6;
  
  const slides = document.querySelectorAll('.slide');
  const slideIndicator = document.getElementById('slide-indicator');
  const btnPrev = document.getElementById('btn-prev');
  const btnNext = document.getElementById('btn-next');
  const btnStartPitch = document.getElementById('btn-start-pitch');
  const btnJumpDb = document.getElementById('btn-jump-db');
  const btnMilestoneNext = document.getElementById('btn-milestone-next');
  
  const pitchContainer = document.getElementById('pitch-container');
  const dashboardContainer = document.getElementById('dashboard-container');
  const btnModePitch = document.getElementById('btn-mode-pitch');
  const btnModeDashboard = document.getElementById('btn-mode-dashboard');
  const slideNavControls = document.getElementById('slide-nav-controls');

  function updateSlide(index) {
    // Guard: 슬라이드 요소가 없는 페이지(dashboard.html)에서는 동작하지 않음
    if (!slides.length) return;
    if (index < 1 || index > totalSlides) return;

    const targetSlide = document.getElementById(`slide-${index}`);
    if (!targetSlide) return;

    // Update active slide class
    slides.forEach(slide => slide.classList.remove('active'));
    targetSlide.classList.add('active');

    currentSlide = index;

    // Update indicator
    if (slideIndicator) slideIndicator.textContent = `${currentSlide} / ${totalSlides}`;

    // Update buttons disabled state
    if (btnPrev) btnPrev.disabled = (currentSlide === 1);
    if (btnNext) btnNext.disabled = (currentSlide === totalSlides);
  }

  // Slide controls event listeners
  if (btnPrev) btnPrev.addEventListener('click', () => updateSlide(currentSlide - 1));
  if (btnNext) btnNext.addEventListener('click', () => updateSlide(currentSlide + 1));
  
  if (btnStartPitch) {
    btnStartPitch.addEventListener('click', () => updateSlide(2));
  }
  
  // Keyboard navigation
  document.addEventListener('keydown', (e) => {
    // Only navigate slides if the pitch deck is visible
    if (btnModePitch && btnModePitch.classList.contains('active')) {
      if (e.key === 'ArrowLeft') {
        updateSlide(currentSlide - 1);
      } else if (e.key === 'ArrowRight') {
        updateSlide(currentSlide + 1);
      }
    }
  });

  // Touch Swipe Navigation for mobile/touch screens
  let touchStartX = 0;
  let touchEndX = 0;
  
  document.addEventListener('touchstart', (e) => {
    touchStartX = e.changedTouches[0].screenX;
  }, false);
  
  document.addEventListener('touchend', (e) => {
    touchEndX = e.changedTouches[0].screenX;
    handleSwipe();
  }, false);
  
  function handleSwipe() {
    if (!btnModePitch || !btnModePitch.classList.contains('active')) return;
    
    const swipeThreshold = 50;
    const deltaX = touchEndX - touchStartX;
    
    if (deltaX > swipeThreshold) {
      // Swipe Right -> Prev
      updateSlide(currentSlide - 1);
    } else if (deltaX < -swipeThreshold) {
      // Swipe Left -> Next
      updateSlide(currentSlide + 1);
    }
  }

  // --------------------------------------------------------------------------
  // 2. Mode Toggle (Pitch Presentation vs. Live Dashboard)
  // --------------------------------------------------------------------------
  function setMode(mode) {
    // Guard: 모드 토글 요소가 없는 페이지(dashboard.html)에서는 동작하지 않음
    if (!btnModePitch || !btnModeDashboard || !pitchContainer || !dashboardContainer) return;

    if (mode === 'pitch') {
      btnModePitch.classList.add('active');
      btnModeDashboard.classList.remove('active');
      pitchContainer.style.display = 'block';
      dashboardContainer.classList.remove('active');
      if (slideNavControls) slideNavControls.style.display = 'flex';

      // Stop dashboard rendering animations if necessary, update size of slides
      updateSlide(currentSlide);
    } else {
      btnModePitch.classList.remove('active');
      btnModeDashboard.classList.add('active');
      pitchContainer.style.display = 'none';
      dashboardContainer.classList.add('active');
      if (slideNavControls) slideNavControls.style.display = 'none';

      // Recalculate size of Chart.js since it was hidden
      if (trendsChart) {
        trendsChart.resize();
      }
    }
  }

  if (btnModePitch) btnModePitch.addEventListener('click', () => setMode('pitch'));
  if (btnModeDashboard) btnModeDashboard.addEventListener('click', () => setMode('dashboard'));
  if (btnJumpDb) btnJumpDb.addEventListener('click', () => setMode('dashboard'));
  if (btnMilestoneNext) btnMilestoneNext.addEventListener('click', () => setMode('dashboard'));

  // --------------------------------------------------------------------------
  // 3. Slide 2: Congestion Slider Simulator
  // --------------------------------------------------------------------------
  const congestionSlider = document.getElementById('congestion-slider');
  const sliderTimeText = document.getElementById('slider-time-text');
  const co2MetricVal = document.getElementById('co2-metric-val');
  const odorMetricVal = document.getElementById('odor-metric-val');
  const satisfactionMetricVal = document.getElementById('satisfaction-metric-val');
  
  const co2Card = document.getElementById('co2-metric-card');
  const odorCard = document.getElementById('odor-metric-card');
  const satCard = document.getElementById('satisfaction-metric-card');

  if (congestionSlider) {
    congestionSlider.addEventListener('input', (e) => {
      const minutes = parseInt(e.target.value);
      
      // Update label
      if (minutes === 0) {
        sliderTimeText.textContent = "시작 직후 (여유)";
      } else {
        sliderTimeText.textContent = `${minutes}분 경과 ${minutes >= 15 ? '(매우 혼잡)' : ''}`;
      }
      
      // Calculate dynamic metrics
      const calculatedCO2 = 450 + (minutes * 42); // CO2 rises with time
      co2MetricVal.textContent = `${calculatedCO2} ppm`;
      
      let odorText = "좋음 (쾌적)";
      let satisfactionText = "매우 높음";
      
      // Reset classes
      co2MetricVal.className = "metric-value";
      odorMetricVal.className = "metric-value";
      satisfactionMetricVal.className = "metric-value";
      
      co2Card.classList.remove('alert-active');
      odorCard.classList.remove('alert-active');
      satCard.classList.remove('alert-active');
      
      // Grade styling based on thresholds
      if (calculatedCO2 < 700) {
        co2MetricVal.classList.add('green');
        odorText = "쾌적 (좋음)";
        odorMetricVal.classList.add('green');
        satisfactionMetricVal.classList.add('cyan');
      } else if (calculatedCO2 < 1200) {
        co2MetricVal.classList.add('cyan');
        odorText = "보통 (환기 권장)";
        odorMetricVal.classList.add('cyan');
        satisfactionText = "보통";
        satisfactionMetricVal.classList.add('cyan');
      } else {
        co2MetricVal.classList.add('red');
        co2Card.classList.add('alert-active');
        
        odorText = "나쁨 (악취 정체)";
        odorMetricVal.classList.add('red');
        odorCard.classList.add('alert-active');
        
        satisfactionText = "하락 위험";
        satisfactionMetricVal.classList.add('red');
        satCard.classList.add('alert-active');
      }
      
      odorMetricVal.textContent = odorText;
      satisfactionMetricVal.textContent = satisfactionText;
    });
  }

  // --------------------------------------------------------------------------
  // 4. Slide 3: Patented Auto-Cleaning Simulation
  // --------------------------------------------------------------------------
  const btnContaminateFilter = document.getElementById('btn-contaminate-filter');
  const btnTriggerCleanSlide = document.getElementById('btn-trigger-clean-slide');
  const filterClogPercent = document.getElementById('filter-clog-percent');
  const filterClogFill = document.getElementById('filter-clog-fill');
  const ionEfficiencyPercent = document.getElementById('ion-efficiency-percent');
  const ionEfficiencyFill = document.getElementById('ion-efficiency-fill');
  const cleaningStatusTag = document.getElementById('cleaning-status-tag');
  
  let slideFilterClog = 4;
  let slideIonEfficiency = 99.5;
  let isSlideCleaning = false;

  function updateSlideCloggingUI() {
    // Guard: 슬라이드 시뮬레이터 요소가 없는 페이지(dashboard.html)에서는 동작하지 않음
    if (!filterClogPercent || !filterClogFill || !ionEfficiencyPercent || !ionEfficiencyFill || !cleaningStatusTag) return;
    filterClogPercent.textContent = `${slideFilterClog.toFixed(0)}%`;
    filterClogFill.style.width = `${slideFilterClog}%`;
    ionEfficiencyPercent.textContent = `${slideIonEfficiency.toFixed(1)}%`;
    ionEfficiencyFill.style.width = `${slideIonEfficiency}%`;
    
    // Change bars classes
    if (slideFilterClog < 15) {
      filterClogFill.className = "sys-bar-fill green";
      ionEfficiencyFill.className = "sys-bar-fill cyan";
      cleaningStatusTag.textContent = "양호 (필터 청결)";
      cleaningStatusTag.className = "density-badge smooth";
    } else if (slideFilterClog < 60) {
      filterClogFill.className = "sys-bar-fill yellow";
      ionEfficiencyFill.className = "sys-bar-fill yellow";
      cleaningStatusTag.textContent = "주의 (클리닝 필요)";
      cleaningStatusTag.className = "density-badge normal";
    } else {
      filterClogFill.className = "sys-bar-fill red";
      ionEfficiencyFill.className = "sys-bar-fill red";
      cleaningStatusTag.textContent = "오염 (정화 저하)";
      cleaningStatusTag.className = "density-badge busy";
    }
  }

  if (btnContaminateFilter) {
    btnContaminateFilter.addEventListener('click', () => {
      if (isSlideCleaning) return;
      slideFilterClog = Math.min(100, slideFilterClog + 24);
      slideIonEfficiency = Math.max(50, 100 - (slideFilterClog * 0.45));
      updateSlideCloggingUI();
      
      // Also update dashboard state to synchronize
      dbFilterClog = slideFilterClog;
      dbEfficiency = slideIonEfficiency;
      updateDbCloggingUI();
    });
  }

  if (btnTriggerCleanSlide) {
    btnTriggerCleanSlide.addEventListener('click', () => {
      if (isSlideCleaning) return;
      isSlideCleaning = true;
      
      // Visual feedback
      cleaningStatusTag.textContent = "자율 세정 구동 중...";
      cleaningStatusTag.className = "density-badge normal";
      
      // Add animation to the slide's visual cue if present or just trigger global
      triggerAutoCleanRoutine(() => {
        slideFilterClog = 1;
        slideIonEfficiency = 99.8;
        updateSlideCloggingUI();
        isSlideCleaning = false;
      });
    });
  }

  // --------------------------------------------------------------------------
  // 5. Slide 4: GPIO Local Control Simulator
  // --------------------------------------------------------------------------
  const gpioBtns = document.querySelectorAll('.gpio-btn');
  const gpioPowerStatus = document.getElementById('gpio-power-status');
  const gpioDutyStatus = document.getElementById('gpio-duty-status');
  
  gpioBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      gpioBtns.forEach(b => b.classList.remove('active'));
      const targetBtn = e.currentTarget;
      targetBtn.classList.add('active');
      
      const speed = targetBtn.getAttribute('data-speed');
      let power = "OFF";
      let duty = "0%";
      let color = "#64748B";
      let speedCode = 0; // for simulation linkage
      
      switch(speed) {
        case 'weak':
          power = "ON";
          duty = "35%";
          color = "var(--neon-green)";
          speedCode = 1;
          break;
        case 'medium':
          power = "ON";
          duty = "65%";
          color = "var(--neon-cyan)";
          speedCode = 2;
          break;
        case 'strong':
          power = "ON";
          duty = "100%";
          color = "var(--spoany-orange)";
          speedCode = 3;
          break;
        default:
          power = "OFF";
          duty = "0%";
          color = "#64748B";
          speedCode = 0;
      }
      
      gpioPowerStatus.textContent = power;
      gpioPowerStatus.style.color = color;
      gpioDutyStatus.textContent = duty;
      gpioDutyStatus.style.color = color;
      
      // Also apply this speed to the live simulator if manual mode is enabled
      if (systemMode === 'manual') {
        fanSpeed = speedCode;
        logEvent(`사용자 수동 4-Pin GPIO 입력 감지: Speed Level ${speedCode} (전력 듀티: ${duty})`);
      }
    });
  });

  // --------------------------------------------------------------------------
  // 6. Slide 5: Sensor Space Comparison
  // --------------------------------------------------------------------------
  const btnSensorGx = document.getElementById('btn-sensor-gx');
  const btnSensorOpen = document.getElementById('btn-sensor-open');
  const valSensorPm = document.getElementById('val-sensor-pm');
  const valSensorNh3 = document.getElementById('val-sensor-nh3');
  const valSensorH2s = document.getElementById('val-sensor-h2s');

  if (btnSensorGx && btnSensorOpen) {
    btnSensorGx.addEventListener('click', () => {
      btnSensorGx.classList.add('active');
      btnSensorOpen.classList.remove('active');
      
      valSensorPm.textContent = "8 ㎍/㎥";
      valSensorNh3.textContent = "0.78 ppm";
      valSensorH2s.textContent = "0.05 ppm";
    });
    
    btnSensorOpen.addEventListener('click', () => {
      btnSensorGx.classList.remove('active');
      btnSensorOpen.classList.add('active');
      
      valSensorPm.textContent = "38 ㎍/㎥"; // higher foot traffic dust
      valSensorNh3.textContent = "0.08 ppm"; // more open air dilutes smell
      valSensorH2s.textContent = "0.01 ppm";
    });
  }

  // --------------------------------------------------------------------------
  // 7. Slide 6: Milestone Checkbox & Roadmap
  // --------------------------------------------------------------------------
  const milestoneProgressText = document.getElementById('milestone-progress-text');
  const milestoneProgressFill = document.getElementById('milestone-progress-fill');
  
  const chkPoc3 = document.getElementById('chk-poc-3');
  const chkNation1 = document.getElementById('chk-nation-1');
  const chkNation2 = document.getElementById('chk-nation-2');
  const chkNation3 = document.getElementById('chk-nation-3');
  
  const phaseRoadmaps = document.querySelectorAll('.roadmap-phase');
  
  phaseRoadmaps.forEach(phase => {
    phase.addEventListener('click', (e) => {
      // Avoid toggle collapse when clicking internal inputs
      if (e.target.tagName === 'INPUT') return;
      phaseRoadmaps.forEach(p => p.classList.remove('active'));
      phase.classList.add('active');
    });
  });

  function updateMilestoneProgress() {
    const lockedChecked = 2; // 2 items in phase 1 are locked and checked
    let checkedCount = lockedChecked;
    
    if (chkPoc3 && chkPoc3.checked) checkedCount++;
    if (chkNation1 && chkNation1.checked) checkedCount++;
    if (chkNation2 && chkNation2.checked) checkedCount++;
    if (chkNation3 && chkNation3.checked) checkedCount++;
    
    const progressPercent = Math.round((checkedCount / 6) * 100);
    
    milestoneProgressText.textContent = `${progressPercent}%`;
    milestoneProgressFill.style.width = `${progressPercent}%`;
  }

  [chkPoc3, chkNation1, chkNation2, chkNation3].forEach(chk => {
    if (chk) {
      chk.addEventListener('change', updateMilestoneProgress);
    }
  });

  // --------------------------------------------------------------------------
  // 8. Live Dashboard Simulation Core
  // --------------------------------------------------------------------------
  let occupants = 20;
  let externalPollution = 35;
  let fanSpeed = 1; // 0: OFF, 1: Weak, 2: Med, 3: Strong
  let systemMode = 'auto'; // 'auto' or 'manual'
  
  // Dynamic telemetry metrics
  let co2Val = 480;
  let pmVal = 6;
  let tvocVal = 0.04;
  let dbFilterClog = 4;
  let dbEfficiency = 99.5;
  let isDbCleaning = false;
  
  // Dashboard UI hook points
  const simOccupants = document.getElementById('sim-occupants');
  const simPollution = document.getElementById('sim-pollution');
  const valOccupantCount = document.getElementById('val-occupant-count');
  const valPollutionDust = document.getElementById('val-pollution-dust');
  
  const btnModeAuto = document.getElementById('btn-mode-auto');
  const btnModeManual = document.getElementById('btn-mode-manual');
  
  const dbOverallStatus = document.getElementById('db-overall-status');
  const sumCardStatus = document.getElementById('sum-card-status');
  const dbCo2Val = document.getElementById('db-co2-val');
  const dbPmVal = document.getElementById('db-pm-val');
  const dbDeodorRatio = document.getElementById('db-deodor-ratio');
  const dbClogPercent = document.getElementById('db-clog-percent');
  const dbClogFill = document.getElementById('db-clog-fill');
  const dbEfficiencyPercent = document.getElementById('db-efficiency-percent');
  const dbEfficiencyFill = document.getElementById('db-efficiency-fill');
  const brushMotorState = document.getElementById('brush-motor-state');
  const motorBrush = document.getElementById('motor-brush');
  const btnTriggerCleanDb = document.getElementById('btn-trigger-clean-db');
  
  // Zone metrics in blueprint map
  const zoneCo2Gx = document.getElementById('zone-co2-gx');
  const zoneCo2Spinning = document.getElementById('zone-co2-spinning');
  const zoneCo2Cardio = document.getElementById('zone-co2-cardio');
  const zoneCo2Free = document.getElementById('zone-co2-free');
  
  const zoneGxEl = document.getElementById('zone-gx');
  const zoneSpinningEl = document.getElementById('zone-spinning');
  const zoneCardioEl = document.getElementById('zone-cardio');
  const zoneFreeEl = document.getElementById('zone-free');

  // Simulator control events
  if (simOccupants) {
    simOccupants.addEventListener('input', (e) => {
      occupants = parseInt(e.target.value);
      valOccupantCount.textContent = `${occupants} 명`;
    });
  }

  if (simPollution) {
    simPollution.addEventListener('input', (e) => {
      externalPollution = parseInt(e.target.value);
      let grade = "좋음";
      if (externalPollution > 35) grade = "보통";
      if (externalPollution > 75) grade = "나쁨";
      if (externalPollution > 150) grade = "매우 나쁨";
      valPollutionDust.textContent = `${grade} (${externalPollution} ㎍/㎥)`;
    });
  }

  if (btnModeAuto && btnModeManual) {
    btnModeAuto.addEventListener('click', () => {
      systemMode = 'auto';
      btnModeAuto.classList.add('active');
      btnModeManual.classList.remove('active');
      logEvent("자율 AI 공조 모드로 전환되었습니다.");
    });

    btnModeManual.addEventListener('click', () => {
      systemMode = 'manual';
      btnModeAuto.classList.remove('active');
      btnModeManual.classList.add('active');
      logEvent("사용자 수동 통제 모드로 전환되었습니다.");
    });
  }

  // Event logging helper
  const eventLogBox = document.getElementById('event-log-box');
  function logEvent(message) {
    const time = new Date();
    const timeString = `[${String(time.getHours()).padStart(2, '0')}:${String(time.getMinutes()).padStart(2, '0')}:${String(time.getSeconds()).padStart(2, '0')}]`;
    
    const logEntry = document.createElement('div');
    logEntry.className = 'log-entry';
    logEntry.innerHTML = `<span class="log-time">${timeString}</span> <span class="log-msg">${message}</span>`;
    
    if (eventLogBox) {
      eventLogBox.appendChild(logEntry);
      // Limit entries to 40
      while (eventLogBox.children.length > 40) {
        eventLogBox.removeChild(eventLogBox.firstChild);
      }
      eventLogBox.scrollTop = eventLogBox.scrollHeight;
    }
  }

  // Trigger Autoclean Routine
  function triggerAutoCleanRoutine(callback) {
    isDbCleaning = true;

    // UI Update (요소가 없는 페이지에서도 에러 없이 동작)
    if (brushMotorState) {
      brushMotorState.textContent = "세정 구동 중 (CLEANING...)";
      brushMotorState.style.color = "var(--spoany-orange)";
    }

    if (motorBrush) {
      motorBrush.classList.add('cleaning-active');
    }
    
    logEvent("자율 전극 오토 클리닝 시퀀스 작동 시작... 마이크로 모터 가동.");
    logEvent("실리콘 브러시가 고전압 침상 방전 침(Carbon Needle) 표면의 흡착 오염물질을 쓸어내립니다.");
    
    setTimeout(() => {
      if (motorBrush) {
        motorBrush.classList.remove('cleaning-active');
      }

      if (brushMotorState) {
        brushMotorState.textContent = "대기 (IDLE)";
        brushMotorState.style.color = "var(--neon-green)";
      }
      
      dbFilterClog = 1;
      dbEfficiency = 99.8;
      updateDbCloggingUI();
      
      logEvent("전극 자율 세정이 성공적으로 끝났습니다. 플라즈마 방전 전극 효율이 99.8%로 즉시 회복되었습니다.");
      isDbCleaning = false;
      
      if (callback) callback();
    }, 3000);
  }

  function updateDbCloggingUI() {
    // Guard: 대시보드 요소가 없는 페이지에서는 동작하지 않음
    if (!dbClogPercent || !dbClogFill || !dbEfficiencyPercent || !dbEfficiencyFill) return;
    dbClogPercent.textContent = `${dbFilterClog.toFixed(0)}%`;
    dbClogFill.style.width = `${dbFilterClog}%`;
    dbEfficiencyPercent.textContent = `${dbEfficiency.toFixed(1)}%`;
    dbEfficiencyFill.style.width = `${dbEfficiency}%`;
    
    // Bar Colors
    if (dbFilterClog < 15) {
      dbClogFill.className = "sys-bar-fill green";
      dbEfficiencyFill.className = "sys-bar-fill cyan";
    } else if (dbFilterClog < 60) {
      dbClogFill.className = "sys-bar-fill yellow";
      dbEfficiencyFill.className = "sys-bar-fill yellow";
    } else {
      dbClogFill.className = "sys-bar-fill red";
      dbEfficiencyFill.className = "sys-bar-fill red";
    }
  }

  if (btnTriggerCleanDb) {
    btnTriggerCleanDb.addEventListener('click', () => {
      if (isDbCleaning) return;
      triggerAutoCleanRoutine(() => {
        // synchronize with slide 3 variables
        slideFilterClog = dbFilterClog;
        slideIonEfficiency = dbEfficiency;
        updateSlideCloggingUI();
      });
    });
  }

  // Physics Simulation Loop
  let lastAutoSpeed = 1;
  
  setInterval(() => {
    // Guard: 대시보드 요소가 없는 페이지에서는 시뮬레이션 루프를 건너뜀
    if (!dbCo2Val || !dbPmVal || !dbDeodorRatio || !dbOverallStatus) return;

    // 1. In Auto Mode, AI controls fan speed based on pollution levels
    if (systemMode === 'auto') {
      if (co2Val > 1100 || pmVal > 75) {
        fanSpeed = 3; // strong
      } else if (co2Val > 750 || pmVal > 35) {
        fanSpeed = 2; // medium
      } else if (co2Val > 500) {
        fanSpeed = 1; // weak
      } else {
        fanSpeed = 0; // off
      }
      
      if (fanSpeed !== lastAutoSpeed) {
        logEvent(`[AI 자율 모드] 실내 센서 피드백 연산에 따라 공조 강도를 Level ${fanSpeed} (으)로 스케줄 변경했습니다.`);
        lastAutoSpeed = fanSpeed;
      }
    }
    
    // 2. Physics logic updates (Euler integration per second)
    // CO2 generation (occupants add CO2)
    const co2Gen = occupants * 0.16;
    // CO2 reduction (fan ventilation removes it, clean outdoor is 400ppm)
    const co2Reduction = fanSpeed * 1.8;
    const co2Infiltration = (400 - co2Val) * 0.01;
    co2Val = Math.max(400, co2Val + co2Gen - co2Reduction + co2Infiltration);
    
    // Odor gas (NH3 / TVOC index)
    const tvocGen = occupants * 0.0004;
    const tvocReduction = fanSpeed * 0.005 + (dbEfficiency / 100) * 0.006;
    tvocVal = Math.max(0.01, tvocVal + tvocGen - tvocReduction);
    
    // PM2.5 Infiltration & filtration
    const pmInfiltration = (externalPollution - pmVal) * 0.04;
    const pmReduction = fanSpeed * 0.8 + (dbEfficiency / 100) * 0.9;
    pmVal = Math.max(1, pmVal + pmInfiltration - pmReduction);
    
    // Clogging increases over time
    if (fanSpeed > 0 && !isDbCleaning) {
      dbFilterClog = Math.min(100, dbFilterClog + (fanSpeed * 0.004) + (pmVal * 0.0001));
      dbEfficiency = Math.max(50, 100 - (dbFilterClog * 0.45));
      updateDbCloggingUI();
      
      // Auto cleaning trigger if filter gets too dirty in auto mode
      if (dbFilterClog > 75 && systemMode === 'auto') {
        logEvent("[자율 AI 안전 알림] 침상 방전극 오염치 75% 초과 감지. 특허 메커니즘 전극 세정을 자율 개시합니다.");
        triggerAutoCleanRoutine();
      }
    }
    
    // 3. Update dashboard UI
    dbCo2Val.innerHTML = `${co2Val.toFixed(0)} <span style="font-size: 0.8rem; font-weight:normal; color:#64748B;">ppm</span>`;
    dbPmVal.innerHTML = `${pmVal.toFixed(0)} <span style="font-size: 0.8rem; font-weight:normal; color:#64748B;">㎍/㎥</span>`;
    
    // Deodorization ratio calculation based on TVOC
    const maxTvoc = 1.5;
    const currentReductionRatio = Math.max(30, 99.9 - (tvocVal * 60));
    dbDeodorRatio.textContent = `${Math.min(99.9, currentReductionRatio).toFixed(1)}%`;
    
    // Map zones indicators updates (with slightly randomized values per zone)
    const gxCo2 = Math.max(400, co2Val * 0.95 + (occupants * 0.1));
    const spinningCo2 = Math.max(400, co2Val * 1.05 + (occupants * 0.3)); // spinning has higher breath rate
    const cardioCo2 = Math.max(400, co2Val * 0.98 + (occupants * 0.05));
    const freeCo2 = Math.max(400, co2Val * 0.92 + (occupants * 0.03));
    
    zoneCo2Gx.textContent = gxCo2.toFixed(0);
    zoneCo2Spinning.textContent = spinningCo2.toFixed(0);
    zoneCo2Cardio.textContent = cardioCo2.toFixed(0);
    zoneCo2Free.textContent = freeCo2.toFixed(0);
    
    // Apply health style classes to map zones
    updateZoneHealthClass(zoneGxEl, gxCo2);
    updateZoneHealthClass(zoneSpinningEl, spinningCo2);
    updateZoneHealthClass(zoneCardioEl, cardioCo2);
    updateZoneHealthClass(zoneFreeEl, freeCo2);
    
    // Overall status calculations
    let overallStatus = "매우 좋음";
    let scoreColorClass = "glowing-green";
    let statusEmoji = "🍃";
    
    if (co2Val > 1500 || pmVal > 75) {
      overallStatus = "오염 (정화 긴급)";
      scoreColorClass = "glowing-red";
      statusEmoji = "⚠️";
      dbOverallStatus.style.color = "var(--neon-red)";
    } else if (co2Val > 900 || pmVal > 35) {
      overallStatus = "보통 (공조 가동)";
      scoreColorClass = "glowing-yellow";
      statusEmoji = "💨";
      dbOverallStatus.style.color = "var(--neon-yellow)";
    } else {
      overallStatus = "매우 좋음 (안심)";
      scoreColorClass = "glowing-green";
      statusEmoji = "🍃";
      dbOverallStatus.style.color = "var(--neon-green)";
    }
    
    dbOverallStatus.textContent = overallStatus;
    if (sumCardStatus) {
      sumCardStatus.className = `sum-card ${scoreColorClass}`;
      sumCardStatus.querySelector('.sum-icon').textContent = statusEmoji;
    }
    
  }, 1000);

  function updateZoneHealthClass(element, value) {
    if (!element) return;
    element.classList.remove('healthy', 'warning', 'critical');
    
    if (value < 750) {
      element.classList.add('healthy');
    } else if (value < 1200) {
      element.classList.add('warning');
    } else {
      element.classList.add('critical');
    }
  }

  // --------------------------------------------------------------------------
  // 9. Air Particle Flow Canvas (Visual Wow Factor)
  // --------------------------------------------------------------------------
  const particlesCanvas = document.getElementById('air-particles-canvas');
  const ctx = particlesCanvas ? particlesCanvas.getContext('2d') : null;
  let animationFrameId;
  const particles = [];
  
  function resizeCanvas() {
    if (particlesCanvas) {
      particlesCanvas.width = particlesCanvas.parentElement.clientWidth;
      particlesCanvas.height = particlesCanvas.parentElement.clientHeight;
    }
  }

  window.addEventListener('resize', resizeCanvas);
  resizeCanvas();

  // Particle blueprint class
  class Particle {
    constructor(x, y, targetX, targetY) {
      this.x = x;
      this.y = y;
      this.targetX = targetX;
      this.targetY = targetY;
      this.speed = 0.5 + Math.random() * 1.5;
      this.radius = 1 + Math.random() * 2.2;
      this.alpha = 0.1 + Math.random() * 0.8;
      this.color = Math.random() > 0.4 ? 'rgba(0, 240, 255, ' : 'rgba(57, 255, 20, '; // Cyan/Green flow
    }
    
    update() {
      // Move towards target
      const dx = this.targetX - this.x;
      const dy = this.targetY - this.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      // Fan speed controls velocity multiplier
      const speedMultiplier = fanSpeed * 1.2;
      
      if (distance > 2 && speedMultiplier > 0) {
        this.x += (dx / distance) * this.speed * speedMultiplier;
        this.y += (dy / distance) * this.speed * speedMultiplier;
      } else {
        // Reset to original random node position
        const startNodes = [
          {x: particlesCanvas.width * 0.3, y: particlesCanvas.height * 0.2}, // vent 1
          {x: particlesCanvas.width * 0.3, y: particlesCanvas.height * 0.7}, // vent 2
          {x: particlesCanvas.width * 0.75, y: particlesCanvas.height * 0.25}, // vent 3
          {x: particlesCanvas.width * 0.75, y: particlesCanvas.height * 0.75}  // vent 4
        ];
        const randomStart = startNodes[Math.floor(Math.random() * startNodes.length)];
        this.x = randomStart.x + (Math.random() * 30 - 15);
        this.y = randomStart.y + (Math.random() * 30 - 15);
        
        // Random targets inside rooms
        this.targetX = Math.random() * particlesCanvas.width;
        this.targetY = Math.random() * particlesCanvas.height;
      }
    }
    
    draw() {
      if (!ctx) return;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
      ctx.fillStyle = `${this.color}${this.alpha})`;
      ctx.shadowBlur = 4;
      ctx.shadowColor = 'rgba(0, 240, 255, 0.4)';
      ctx.fill();
      ctx.shadowBlur = 0; // reset
    }
  }

  // Populate particles
  function initParticles() {
    particles.length = 0;
    const count = 75;
    for (let i = 0; i < count; i++) {
      const startX = Math.random() * (particlesCanvas ? particlesCanvas.width : 500);
      const startY = Math.random() * (particlesCanvas ? particlesCanvas.height : 300);
      const targetX = Math.random() * (particlesCanvas ? particlesCanvas.width : 500);
      const targetY = Math.random() * (particlesCanvas ? particlesCanvas.height : 300);
      particles.push(new Particle(startX, startY, targetX, targetY));
    }
  }

  function animateParticles() {
    if (!ctx || !particlesCanvas) return;
    
    // Fade background to create motion trails
    ctx.fillStyle = 'rgba(4, 7, 18, 0.15)';
    ctx.fillRect(0, 0, particlesCanvas.width, particlesCanvas.height);
    
    particles.forEach(p => {
      p.update();
      p.draw();
    });
    
    animationFrameId = requestAnimationFrame(animateParticles);
  }

  setTimeout(() => {
    resizeCanvas();
    initParticles();
    animateParticles();
  }, 100);

  // --------------------------------------------------------------------------
  // 10. Chart.js Dynamic Trends (Rich Test Data)
  // --------------------------------------------------------------------------
  const hoursLabels = [];
  const co2TrendData = [];
  const pmTrendData = [];
  const vocTrendData = [];
  
  // Generating 24 hours of rich mock logs data matching typical gym crowd peak periods
  function generateTrendMockData() {
    const now = new Date();
    for (let i = 23; i >= 0; i--) {
      const timePoint = new Date(now.getTime() - i * 60 * 60 * 1000);
      const hourStr = `${String(timePoint.getHours()).padStart(2, '0')}:00`;
      hoursLabels.push(hourStr);
      
      const hour = timePoint.getHours();
      let trafficFactor = 10; // low traffic by default
      
      // Define traffic peaks
      if (hour >= 7 && hour <= 9) {
        trafficFactor = 75; // morning rush
      } else if (hour >= 18 && hour <= 21) {
        trafficFactor = 120; // evening massive rush
      } else if (hour >= 12 && hour <= 14) {
        trafficFactor = 35; // lunch rush
      } else if (hour >= 23 || hour <= 5) {
        trafficFactor = 0; // closed
      } else {
        trafficFactor = 25; // standard daytime
      }
      
      // Calculate corresponding trends (CO2, PM2.5, VOCs)
      const mockCo2 = Math.round(410 + (trafficFactor * 6.5) + (Math.random() * 50 - 25));
      const mockPm = Math.round(5 + (trafficFactor * 0.22) + (Math.random() * 6 - 3));
      const mockVoc = parseFloat((0.02 + (trafficFactor * 0.0035) + (Math.random() * 0.05)).toFixed(3));
      
      co2TrendData.push(mockCo2);
      pmTrendData.push(mockPm);
      vocTrendData.push(mockVoc);
    }
  }

  generateTrendMockData();

  // Create Chart.js Instance
  const trendsCanvas = document.getElementById('historical-trends-chart');
  let trendsChart = null;

  if (trendsCanvas) {
    const config = {
      type: 'line',
      data: {
        labels: hoursLabels,
        datasets: [{
          label: '이산화탄소 농도 (CO2 - ppm)',
          data: co2TrendData,
          borderColor: '#ff3c42',
          backgroundColor: 'rgba(255, 60, 66, 0.1)',
          borderWidth: 3,
          tension: 0.35,
          fill: true,
          pointRadius: 4,
          pointHoverRadius: 7,
          shadowBlur: 10,
          shadowColor: 'rgba(255, 60, 66, 0.5)'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false
          },
          tooltip: {
            mode: 'index',
            intersect: false,
            backgroundColor: 'rgba(11, 17, 32, 0.9)',
            titleColor: '#FFFFFF',
            bodyColor: '#E2E8F0',
            borderColor: 'rgba(255,255,255,0.08)',
            borderWidth: 1,
            titleFont: {
              family: 'Outfit',
              weight: 'bold'
            },
            bodyFont: {
              family: 'Inter'
            }
          }
        },
        scales: {
          x: {
            grid: {
              color: 'rgba(255, 255, 255, 0.02)'
            },
            ticks: {
              color: '#64748B',
              font: {
                family: 'Outfit'
              }
            }
          },
          y: {
            grid: {
              color: 'rgba(255, 255, 255, 0.04)'
            },
            ticks: {
              color: '#64748B',
              font: {
                family: 'Outfit'
              }
            }
          }
        }
      }
    };
    
    trendsChart = new Chart(trendsCanvas, config);
  }

  // Handle Chart View toggles
  const chartToggleBtns = document.querySelectorAll('.chart-toggle-btn');
  chartToggleBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      chartToggleBtns.forEach(b => b.classList.remove('active'));
      const activeBtn = e.currentTarget;
      activeBtn.classList.add('active');
      
      const chartType = activeBtn.getAttribute('data-chart-type');
      
      if (!trendsChart) return;
      
      let datasetLabel = '';
      let datasetData = [];
      let strokeColor = '';
      let bgColor = '';
      
      switch(chartType) {
        case 'pm':
          datasetLabel = '초미세먼지 농도 (PM2.5 - ㎍/㎥)';
          datasetData = pmTrendData;
          strokeColor = '#00F0FF';
          bgColor = 'rgba(0, 240, 255, 0.1)';
          break;
        case 'voc':
          datasetLabel = '유해가스 휘발성유기화합물 (TVOC - mg/㎥)';
          datasetData = vocTrendData;
          strokeColor = '#39FF14';
          bgColor = 'rgba(57, 255, 20, 0.1)';
          break;
        default:
          datasetLabel = '이산화탄소 농도 (CO2 - ppm)';
          datasetData = co2TrendData;
          strokeColor = '#ff3c42';
          bgColor = 'rgba(255, 60, 66, 0.1)';
      }
      
      trendsChart.data.datasets[0].label = datasetLabel;
      trendsChart.data.datasets[0].data = datasetData;
      trendsChart.data.datasets[0].borderColor = strokeColor;
      trendsChart.data.datasets[0].backgroundColor = bgColor;
      
      trendsChart.update();
      logEvent(`차트 보기가 데이터셋 [${datasetLabel}] (으)로 업데이트 되었습니다.`);
    });
  });

  // --------------------------------------------------------------------------
  // 11. Mock Test Data Export (CSV Format)
  // --------------------------------------------------------------------------
  const btnExportCsv = document.getElementById('btn-export-csv');
  
  if (btnExportCsv) {
    btnExportCsv.addEventListener('click', () => {
      let csvContent = "data:text/csv;charset=utf-8,";
      csvContent += "Timestamp,CO2_ppm,PM25_ugm3,TVOC_mgm3,Status\n";
      
      hoursLabels.forEach((label, idx) => {
        const co2 = co2TrendData[idx];
        const pm = pmTrendData[idx];
        const voc = vocTrendData[idx];
        
        let status = "EXCELLENT";
        if (co2 > 1000 || pm > 35) status = "MODERATE";
        if (co2 > 1500 || pm > 75) status = "UNHEALTHY";
        
        csvContent += `${label},${co2},${pm},${voc},${status}\n`;
      });
      
      // Trigger download
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `spoany_air_quality_test_logs_${new Date().toISOString().slice(0,10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      logEvent("최근 24시간 실내 공기질 분석 가상 테스트 로그 데이터가 CSV 형식으로 성공적으로 내보내졌습니다.");
    });
  }

});
