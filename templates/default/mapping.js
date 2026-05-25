/**
 * High-Fidelity Resume Compiler and Mapper
 * Translates JSON resume schema + design tokens into pixel-perfect DOM markup
 */
(function() {
  
  // Helper to translate color with custom opacity (hex to rgba)
  function hexToRgba(hex, alpha) {
    if (!hex) return 'transparent';
    hex = hex.replace('#', '');
    if (hex.length === 3) {
      hex = hex.split('').map(c => c + c).join('');
    }
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }

  // Resolve template configurations based on layout
  function getRenderConfig(layout, config, accent) {
    const base = {
      layout: layout || 'standard',
      headerStyle: "left-standard",
      headerBgOpacity: 8,
      showProfilePhotoInHeader: true,
      profilePhotoShape: "rounded",
      profilePhotoSize: "96px", // 24 * 4
      showTemplateIconInHeader: false,
      contactRow: "inline",
      showLinkedInGithub: false,
      hasSidebar: false,
      sidebarSide: "left",
      sidebarBg: "#f8fafc",
      sidebarTextColor: "#0f172a",
      sidebarSections: ["skills", "education"],
      mainSections: ["summary", "experience", "projects"],
      sectionHeadingStyle: "uppercase-accent",
      dividerStyle: "thin-rule",
      sectionSpacingClass: "24px",
      skillStyle: "dot-list",
      experienceStyle: "plain-rows",
      showDateBadge: true,
      nameSize: "30px",
      headlineSize: "12px",
      bodyTextClass: "text-normal",
      useGridLayout: false,
      gridLabelWidth: "160px",
      pageBackground: "#ffffff",
    };

    const resolvedLayout = layout || 'standard';
    
    // Exact mapping of template-renderer.ts logic
    switch (resolvedLayout) {
      case "sidebar-dark":
      case "sidebar-dark-right":
        return Object.assign({}, base, {
          layout: resolvedLayout,
          hasSidebar: true,
          sidebarSide: resolvedLayout === "sidebar-dark-right" ? "right" : "left",
          sidebarBg: config.sidebarTint || accent,
          sidebarTextColor: "#ffffff",
          sidebarSections: ["skills", "education", "certifications"],
          mainSections: ["summary", "experience", "projects"],
          sectionHeadingStyle: "uppercase-accent",
          headerStyle: "left-standard",
          headerBgOpacity: 0,
          skillStyle: "dot-list",
          experienceStyle: "border-left",
          nameSize: "36px",
          headlineSize: "13px",
          showLinkedInGithub: true,
          showProfilePhotoInHeader: false,
          profilePhotoShape: "rounded",
          profilePhotoSize: "128px",
        });
      
      case "sidebar-circles":
        return Object.assign({}, base, {
          layout: resolvedLayout,
          hasSidebar: true,
          sidebarBg: hexToRgba(accent, 0.08),
          sidebarTextColor: "#0f172a",
          sidebarSections: ["skills", "education", "certifications"],
          mainSections: ["summary", "experience", "projects"],
          sectionHeadingStyle: "uppercase-accent",
          skillStyle: "progress-dot",
          experienceStyle: "timeline-dot",
          showProfilePhotoInHeader: false,
          profilePhotoShape: "circle",
          profilePhotoSize: "110px",
          nameSize: "28px",
        });

      case "sleek-dark":
        return Object.assign({}, base, {
          layout: resolvedLayout,
          headerStyle: "centered-dark-bg",
          headerBgOpacity: 100,
          showProfilePhotoInHeader: true,
          profilePhotoShape: "circle",
          profilePhotoSize: "120px",
          sectionHeadingStyle: "dark-bg-band",
          skillStyle: "pill-tags",
          experienceStyle: "plain-rows",
          mainSections: ["summary", "experience", "skills", "education", "projects"],
          nameSize: "34px",
          showLinkedInGithub: true,
          sectionSpacingClass: "20px",
        });

      case "banner-soft":
        return Object.assign({}, base, {
          layout: resolvedLayout,
          headerStyle: "centered-light-bg",
          headerBgOpacity: 12,
          showProfilePhotoInHeader: true,
          profilePhotoShape: "rounded",
          profilePhotoSize: "100px",
          contactRow: "centered",
          showLinkedInGithub: true,
          hasSidebar: false,
          sectionHeadingStyle: "uppercase-accent",
          skillStyle: "pill-tags",
          experienceStyle: "plain-rows",
          mainSections: ["summary", "experience", "skills", "education", "projects"],
          nameSize: "34px",
          sectionSpacingClass: "24px",
        });

      case "grid-labels":
        return Object.assign({}, base, {
          layout: resolvedLayout,
          useGridLayout: true,
          gridLabelWidth: "160px",
          sectionHeadingStyle: "boxed-label",
          skillStyle: "boxed-grid",
          experienceStyle: "plain-rows",
          headerStyle: "left-standard",
          headerBgOpacity: 0,
          mainSections: ["summary", "experience", "projects", "skills", "education"],
          nameSize: "30px",
          sectionSpacingClass: "20px",
          dividerStyle: "none",
        });

      case "modern-columns":
        return Object.assign({}, base, {
          layout: resolvedLayout,
          headerStyle: "centered-light-bg",
          headerBgOpacity: 0,
          showProfilePhotoInHeader: true,
          profilePhotoShape: "circle",
          profilePhotoSize: "115px",
          contactRow: "centered",
          showLinkedInGithub: true,
          hasSidebar: false,
          skillStyle: "pill-tags",
          sectionHeadingStyle: "uppercase-accent",
          mainSections: ["experience", "education", "projects"],
          sectionSpacingClass: "20px",
          nameSize: "32px",
        });

      case "modular-card":
        return Object.assign({}, base, {
          layout: resolvedLayout,
          headerStyle: "left-standard",
          headerBgOpacity: 0,
          skillStyle: "pill-tags",
          experienceStyle: "card-block",
          sectionHeadingStyle: "uppercase-accent",
          mainSections: ["summary", "experience", "projects", "skills", "education"],
          sectionSpacingClass: "20px",
          nameSize: "32px",
        });

      case "executive-serif":
      case "luxury-gold":
        return Object.assign({}, base, {
          layout: resolvedLayout,
          headerStyle: "left-serif-elegant",
          headerBgOpacity: 10,
          sectionHeadingStyle: "serif-underline",
          dividerStyle: "thick-accent",
          skillStyle: "plain-list",
          experienceStyle: "plain-rows",
          showDateBadge: true,
          mainSections: ["summary", "experience", "projects", "education", "skills"],
          nameSize: "36px",
          headlineSize: "13px",
          sectionSpacingClass: "30px",
          showLinkedInGithub: true,
        });

      case "corporate-minimal":
        return Object.assign({}, base, {
          layout: resolvedLayout,
          headerStyle: "left-compact",
          headerBgOpacity: 5,
          sectionHeadingStyle: "left-border",
          dividerStyle: "thin-rule",
          skillStyle: "pill-tags",
          experienceStyle: "plain-rows",
          mainSections: ["summary", "experience", "education", "skills", "projects"],
          nameSize: "26px",
          sectionSpacingClass: "22px",
        });

      case "deep-charcoal":
        return Object.assign({}, base, {
          layout: resolvedLayout,
          headerStyle: "left-border-rule",
          headerBgOpacity: 12,
          sectionHeadingStyle: "left-border",
          dividerStyle: "thin-rule",
          skillStyle: "pill-tags",
          experienceStyle: "border-left",
          mainSections: ["summary", "experience", "education", "skills", "projects"],
          nameSize: "28px",
          sectionSpacingClass: "24px",
        });

      case "infographic-split":
        return Object.assign({}, base, {
          layout: resolvedLayout,
          hasSidebar: true,
          sidebarBg: hexToRgba(accent, 0.10),
          sidebarTextColor: "#0f172a",
          sidebarSections: ["skills", "education", "certifications"],
          mainSections: ["summary", "experience", "projects"],
          sectionHeadingStyle: "uppercase-accent",
          skillStyle: "progress-dot",
          experienceStyle: "timeline-dot",
          showProfilePhotoInHeader: false,
          profilePhotoShape: "rounded",
          profilePhotoSize: "100px",
          nameSize: "28px",
          sectionSpacingClass: "20px",
        });

      case "startup-metrics":
        return Object.assign({}, base, {
          layout: resolvedLayout,
          hasSidebar: true,
          sidebarBg: hexToRgba(accent, 0.08),
          sidebarTextColor: "#0f172a",
          sidebarSections: ["skills", "education"],
          mainSections: ["summary", "experience", "projects"],
          sectionHeadingStyle: "uppercase-accent",
          skillStyle: "pill-tags",
          experienceStyle: "plain-rows",
          showProfilePhotoInHeader: false,
          nameSize: "26px",
          sectionSpacingClass: "20px",
        });

      case "academic-classic":
        return Object.assign({}, base, {
          layout: resolvedLayout,
          headerStyle: "left-serif-elegant",
          headerBgOpacity: 8,
          sectionHeadingStyle: "serif-underline",
          dividerStyle: "thin-rule",
          skillStyle: "plain-list",
          experienceStyle: "plain-rows",
          mainSections: ["summary", "education", "experience", "projects", "skills"],
          nameSize: "32px",
          sectionSpacingClass: "24px",
          showLinkedInGithub: true,
        });

      case "ultra-clean":
        return Object.assign({}, base, {
          layout: resolvedLayout,
          headerStyle: "left-compact",
          headerBgOpacity: 0,
          sectionHeadingStyle: "uppercase-accent",
          dividerStyle: "thin-rule",
          skillStyle: "plain-list",
          experienceStyle: "plain-rows",
          mainSections: ["summary", "experience", "education", "skills", "projects"],
          nameSize: "26px",
          sectionSpacingClass: "20px",
          showDateBadge: false,
        });

      case "creative-bold":
        return Object.assign({}, base, {
          layout: resolvedLayout,
          hasSidebar: true,
          sidebarBg: hexToRgba(accent, 0.10),
          sidebarTextColor: "#0f172a",
          sidebarSections: ["skills", "education"],
          mainSections: ["summary", "experience", "projects"],
          sectionHeadingStyle: "bold-oversized",
          skillStyle: "pill-tags",
          experienceStyle: "timeline-dot",
          showProfilePhotoInHeader: false,
          profilePhotoShape: "circle",
          profilePhotoSize: "100px",
          nameSize: "30px",
          sectionSpacingClass: "20px",
          showLinkedInGithub: true,
        });

      case "pastel-soft":
        return Object.assign({}, base, {
          layout: resolvedLayout,
          headerStyle: "left-standard",
          headerBgOpacity: 10,
          sectionHeadingStyle: "light-pill",
          dividerStyle: "dotted",
          skillStyle: "pill-tags",
          experienceStyle: "plain-rows",
          mainSections: ["summary", "experience", "education", "skills", "projects"],
          nameSize: "28px",
          sectionSpacingClass: "20px",
          showLinkedInGithub: false,
        });

      case "vibrant-accent":
        return Object.assign({}, base, {
          layout: resolvedLayout,
          hasSidebar: true,
          sidebarBg: hexToRgba(accent, 0.12),
          sidebarTextColor: "#0f172a",
          sidebarSections: ["skills", "education", "certifications"],
          mainSections: ["summary", "experience", "projects"],
          sectionHeadingStyle: "uppercase-accent",
          skillStyle: "pill-tags",
          experienceStyle: "timeline-dot",
          showProfilePhotoInHeader: false,
          profilePhotoShape: "rounded",
          profilePhotoSize: "100px",
          nameSize: "28px",
          sectionSpacingClass: "20px",
          showLinkedInGithub: true,
        });

      case "impactful-bold":
        return Object.assign({}, base, {
          layout: resolvedLayout,
          headerStyle: "left-border-rule",
          headerBgOpacity: 8,
          sectionHeadingStyle: "left-border",
          dividerStyle: "thick-accent",
          skillStyle: "pill-tags",
          experienceStyle: "bold-row",
          mainSections: ["summary", "experience", "projects", "education", "skills"],
          nameSize: "32px",
          sectionSpacingClass: "20px",
        });

      case "hybrid-pro":
        return Object.assign({}, base, {
          layout: resolvedLayout,
          hasSidebar: true,
          sidebarBg: hexToRgba(accent, 0.06),
          sidebarTextColor: "#0f172a",
          sidebarSections: ["skills", "education", "certifications"],
          mainSections: ["summary", "experience", "projects"],
          sectionHeadingStyle: "uppercase-accent",
          skillStyle: "dot-list",
          experienceStyle: "plain-rows",
          showProfilePhotoInHeader: false,
          profilePhotoShape: "rounded",
          profilePhotoSize: "100px",
          nameSize: "26px",
          sectionSpacingClass: "20px",
        });

      case "creative-designer-split":
        return Object.assign({}, base, {
          layout: resolvedLayout,
          hasSidebar: true,
          sidebarBg: hexToRgba(accent, 0.10),
          sidebarTextColor: "#0f172a",
          sidebarSections: ["skills", "education", "certifications"],
          mainSections: ["summary", "experience", "projects"],
          sectionHeadingStyle: "bold-oversized",
          skillStyle: "pill-tags",
          experienceStyle: "timeline-dot",
          showProfilePhotoInHeader: false,
          profilePhotoShape: "circle",
          profilePhotoSize: "110px",
          nameSize: "30px",
          sectionSpacingClass: "20px",
          showLinkedInGithub: true,
        });

      case "bold-header-accent":
        return Object.assign({}, base, {
          layout: resolvedLayout,
          headerStyle: "left-standard",
          headerBgOpacity: 15,
          sectionHeadingStyle: "left-border",
          dividerStyle: "thick-accent",
          skillStyle: "pill-tags",
          experienceStyle: "plain-rows",
          mainSections: ["summary", "experience", "education", "skills", "projects"],
          nameSize: "36px",
          sectionSpacingClass: "22px",
          showLinkedInGithub: true,
        });


      default: // standard fallback
        return Object.assign({}, base, {
          hasSidebar: config.columns === "split",
          sidebarBg: config.sidebarTint || hexToRgba(accent, 0.08),
          mainSections: ["summary", "experience", "projects", "education", "skills"],
          sectionSpacingClass: "24px",
        });
    }
  }

  // Generate Heading DOM
  function renderHeading(title, config, accent) {
    const style = config.sectionHeadingStyle;
    const container = document.createElement('div');
    container.className = 'section-heading-container';
    
    if (style === 'dark-bg-band') {
      const el = document.createElement('div');
      el.className = 'heading-dark-bg-band';
      el.textContent = title;
      container.appendChild(el);
    } else if (style === 'serif-underline') {
      const el = document.createElement('h3');
      el.className = 'heading-serif-underline';
      el.style.color = accent;
      el.style.borderBottomColor = accent;
      el.textContent = title;
      container.appendChild(el);
    } else if (style === 'left-border' || style === 'bold-oversized') {
      const wrapper = document.createElement('div');
      wrapper.className = 'heading-left-border';
      const el = document.createElement('h3');
      el.className = style === 'bold-oversized' ? 'heading-bold-oversized' : 'heading-left-border-text';
      el.style.color = accent;
      el.textContent = title;
      wrapper.appendChild(el);
      container.appendChild(wrapper);
    } else if (style === 'light-pill') {
      const el = document.createElement('span');
      el.className = 'heading-light-pill';
      el.style.backgroundColor = hexToRgba(accent, 0.12);
      el.style.color = accent;
      el.textContent = title;
      container.appendChild(el);
    } else {
      const el = document.createElement('h3');
      el.className = 'heading-uppercase-accent';
      el.style.color = accent;
      el.textContent = title;
      container.appendChild(el);
    }

    // Add divider if requested
    if (config.dividerStyle && config.dividerStyle !== 'none' && style !== 'dark-bg-band' && style !== 'light-pill') {
      const hr = document.createElement('hr');
      hr.className = `divider divider-${config.dividerStyle}`;
      if (config.dividerStyle === 'thick-accent') {
        hr.style.borderTopColor = accent;
      }
      container.appendChild(hr);
    }
    
    return container;
  }

  // Render Skills Section
  function renderSkills(skills, renderConfig, accent) {
    const container = document.createElement('div');
    container.className = 'skills-container';
    
    const isDarkGrid = renderConfig.layout === 'grid-labels';
    container.appendChild(renderHeading('Skills', renderConfig, isDarkGrid ? '#ffffff' : accent));

    const style = renderConfig.skillStyle;
    const body = document.createElement('div');
    
    const isFlex = ['pill-tags', 'inline-tags', 'boxed-grid'].includes(style) || isDarkGrid;
    body.className = isFlex ? 'skills-flex' : 'skills-vertical';

    if (skills.length === 0) {
      const empty = document.createElement('p');
      empty.className = 'skill-plain-list';
      empty.textContent = 'Key skills appear here';
      body.appendChild(empty);
      container.appendChild(body);
      return container;
    }

    if (style === 'plain-list') {
      const p = document.createElement('p');
      p.className = 'skill-plain-list';
      p.textContent = skills.join(' / ');
      body.appendChild(p);
    } else {
      skills.forEach((skill, index) => {
        if (style === 'progress-dot') {
          const row = document.createElement('div');
          row.className = 'skill-progress-row';
          const name = document.createElement('span');
          name.textContent = skill;
          row.appendChild(name);
          
          const dots = document.createElement('span');
          dots.className = 'skill-progress-dots';
          const activeCount = Math.max(3, 5 - (index % 3));
          for (let i = 0; i < 5; i++) {
            const dot = document.createElement('span');
            dot.className = `skill-progress-dot ${i < activeCount ? 'active' : 'inactive'}`;
            if (i < activeCount) {
              dot.style.backgroundColor = accent;
            } else {
              dot.style.backgroundColor = hexToRgba(accent, 0.2);
            }
            dots.appendChild(dot);
          }
          row.appendChild(dots);
          body.appendChild(row);
        } else if (style === 'numbered-bar') {
          const wrapper = document.createElement('div');
          wrapper.className = 'skill-progress-bar-container';
          
          const percent = Math.max(70, 95 - (index % 5) * 5);
          const header = document.createElement('div');
          header.className = 'skill-progress-bar-header';
          const name = document.createElement('span');
          name.textContent = skill;
          const pct = document.createElement('span');
          pct.textContent = `${percent}%`;
          header.appendChild(name);
          header.appendChild(pct);
          wrapper.appendChild(header);

          const track = document.createElement('div');
          track.className = 'skill-progress-bar-track';
          const fill = document.createElement('div');
          fill.className = 'skill-progress-bar-fill';
          fill.style.width = `${percent}%`;
          fill.style.backgroundColor = accent;
          track.appendChild(fill);
          wrapper.appendChild(track);
          
          body.appendChild(wrapper);
        } else if (style === 'pill-tags' || style === 'inline-tags') {
          const pill = document.createElement('span');
          pill.className = 'skill-pill-tag';
          pill.style.borderColor = hexToRgba(accent, 0.24);
          pill.style.backgroundColor = hexToRgba(accent, 0.10);
          pill.style.color = accent;
          pill.textContent = skill;
          body.appendChild(pill);
        } else if (isDarkGrid || style === 'boxed-grid') {
          const pill = document.createElement('span');
          pill.className = 'skill-boxed-grid';
          pill.textContent = skill;
          body.appendChild(pill);
        } else { // default dot-list
          const el = document.createElement('div');
          el.className = 'skill-dot-item';
          const dot = document.createElement('span');
          dot.className = 'skill-dot-indicator';
          dot.style.backgroundColor = accent;
          const text = document.createElement('span');
          text.textContent = skill;
          
          el.appendChild(dot);
          el.appendChild(text);
          body.appendChild(el);
        }
      });
    }

    container.appendChild(body);
    return container;
  }

  // Render Experience Section
  function renderExperience(experience, renderConfig, accent) {
    const container = document.createElement('div');
    container.className = 'section-wrapper';
    container.appendChild(renderHeading('Experience', renderConfig, accent));

    const body = document.createElement('div');
    body.className = 'experience-list';

    const style = renderConfig.experienceStyle;
    const list = experience.filter(item => item.title || item.company);
    
    list.forEach(item => {
      const block = document.createElement('div');
      block.className = 'experience-item';
      
      if (style === 'timeline-dot') {
        block.className += ' exp-timeline-dot';
      } else if (style === 'border-left') {
        block.className += ' exp-border-left';
        block.style.borderLeftColor = accent;
      } else if (style === 'card-block') {
        block.className += ' exp-card-block';
      }

      // Timeline dot color override
      if (style === 'timeline-dot') {
        const dotStyles = document.createElement('style');
        dotStyles.textContent = `.exp-timeline-dot::before { background-color: ${accent} !important; }`;
        block.appendChild(dotStyles);
      }

      const header = document.createElement('div');
      header.className = 'exp-header';
      
      const leftCol = document.createElement('div');
      const title = document.createElement('p');
      title.className = 'exp-title';
      title.textContent = item.title || 'Role Title';
      if (style === 'bold-row') {
        title.style.textTransform = 'uppercase';
        title.style.letterSpacing = '0.04em';
      }
      leftCol.appendChild(title);

      const meta = document.createElement('p');
      meta.className = 'exp-company-location';
      meta.textContent = [item.company, item.location].filter(Boolean).join(' | ');
      leftCol.appendChild(meta);
      header.appendChild(leftCol);

      // Date badge
      if (renderConfig.showDateBadge && (item.startDate || item.endDate || item.current)) {
        const badge = document.createElement('span');
        badge.className = 'exp-date-badge';
        badge.textContent = [item.startDate, item.current ? 'Present' : item.endDate].filter(Boolean).join(' - ');
        header.appendChild(badge);
      }

      block.appendChild(header);

      // Highlights
      if (item.highlights && item.highlights.filter(Boolean).length > 0) {
        const ul = document.createElement('ul');
        ul.className = 'exp-highlights';
        item.highlights.filter(Boolean).forEach(hl => {
          const li = document.createElement('li');
          li.className = 'exp-highlight-item';
          li.textContent = hl;
          ul.appendChild(li);
        });
        block.appendChild(ul);
      }

      body.appendChild(block);
    });

    container.appendChild(body);
    return container;
  }

  // Render Education Section
  function renderEducation(education, renderConfig, accent) {
    const container = document.createElement('div');
    container.className = 'section-wrapper';
    
    const isDarkSidebar = renderConfig.sidebarBg && renderConfig.sidebarTextColor === '#ffffff';
    container.appendChild(renderHeading('Education', renderConfig, isDarkSidebar ? '#ffffff' : accent));

    const body = document.createElement('div');
    body.className = 'education-list';

    education.forEach(item => {
      const block = document.createElement('div');
      block.className = 'edu-item';
      
      const header = document.createElement('div');
      header.className = 'edu-header';
      
      const degree = document.createElement('p');
      degree.className = 'edu-degree';
      degree.textContent = item.degree || 'Degree';
      if (isDarkSidebar) {
        degree.style.color = '#ffffff';
      }
      
      const date = document.createElement('p');
      date.className = 'edu-date';
      date.textContent = item.endDate || '';
      if (isDarkSidebar) {
        date.style.color = 'rgba(255,255,255,0.4)';
      }

      header.appendChild(degree);
      header.appendChild(date);
      block.appendChild(header);

      const school = document.createElement('p');
      school.className = 'edu-school';
      school.textContent = item.school || 'University';
      if (isDarkSidebar) {
        school.style.color = 'rgba(255,255,255,0.6)';
      }
      block.appendChild(school);

      body.appendChild(block);
    });

    container.appendChild(body);
    return container;
  }

  // Render Projects Section
  function renderProjects(projects, renderConfig, accent) {
    const list = projects.filter(item => item.name);
    if (list.length === 0) return null;

    const container = document.createElement('div');
    container.className = 'section-wrapper';
    container.appendChild(renderHeading('Projects', renderConfig, accent));

    const body = document.createElement('div');
    body.className = 'projects-list';

    list.forEach(item => {
      const block = document.createElement('div');
      block.className = 'project-item';

      const name = document.createElement('p');
      name.className = 'project-name';
      name.textContent = item.name;
      block.appendChild(name);

      if (item.role) {
        const role = document.createElement('p');
        role.className = 'project-role';
        role.textContent = item.role;
        block.appendChild(role);
      }

      if (item.highlights && item.highlights.filter(Boolean).length > 0) {
        const wrapper = document.createElement('div');
        wrapper.className = 'project-highlights';
        
        item.highlights.filter(Boolean).forEach(hl => {
          const itemEl = document.createElement('p');
          itemEl.className = 'project-highlight-item';
          
          const bullet = document.createElement('span');
          bullet.className = 'project-bullet';
          const textVal = document.createElement('span');
          textVal.textContent = hl;

          itemEl.appendChild(bullet);
          itemEl.appendChild(textVal);
          wrapper.appendChild(itemEl);
        });
        block.appendChild(wrapper);
      }

      body.appendChild(block);
    });

    container.appendChild(body);
    return container;
  }

  // Core Render Function
  window.renderResume = function(resume, template) {
    const root = document.getElementById('resume-root');
    if (!root) return;
    root.innerHTML = ''; // Reset

    const accent = template.config_json.accent || '#2563eb';
    const layout = template.config_json.layout || 'standard';
    const renderConfig = getRenderConfig(layout, template.config_json, accent);

    // Apply main variable styles
    document.documentElement.style.setProperty('--primary-accent', accent);
    document.documentElement.style.setProperty('--page-bg', template.config_json.pageBackground || '#ffffff');
    document.documentElement.style.setProperty('--sidebar-bg', renderConfig.sidebarBg);
    document.documentElement.style.setProperty('--sidebar-text', renderConfig.sidebarTextColor);
    document.documentElement.style.setProperty('--grid-label-width', renderConfig.gridLabelWidth);
    
    if (template.config_json.density === "compact") {
      document.documentElement.style.setProperty('--density-font-size', '10px');
    } else if (template.config_json.density === "airy") {
      document.documentElement.style.setProperty('--density-font-size', '12.5px');
    } else {
      document.documentElement.style.setProperty('--density-font-size', '11.5px');
    }

    // Apply layout-specific wrapper classes to body/root
    const bodyClass = `typo-${template.config_json.typography || 'modern-sans'} theme-${layout}`;
    document.body.className = bodyClass;

    // Full Name
    const fullName = [resume.personal.firstName, resume.personal.lastName].filter(Boolean).join(' ') || 'Your Name';
    const headline = resume.personal.headline || resume.ats.targetRole || 'Professional Headline';

    // RENDER PERSONAL HEADER (if not sleek-dark/banner-soft custom headers)
    function buildHeader(isCentered) {
      const header = document.createElement('div');
      header.className = `header-container ${isCentered ? 'centered' : ''}`;
      header.style.backgroundColor = hexToRgba(accent, renderConfig.headerBgOpacity / 100);
      
      const inner = document.createElement('div');
      inner.className = `header-inner ${isCentered ? 'centered' : ''}`;

      // Photo
      if (resume.personal.profilePhotoUrl && renderConfig.showProfilePhotoInHeader) {
        const photoDiv = document.createElement('div');
        photoDiv.className = `profile-photo photo-${renderConfig.profilePhotoShape}`;
        photoDiv.style.width = renderConfig.profilePhotoSize;
        photoDiv.style.height = renderConfig.profilePhotoSize;
        
        const img = document.createElement('img');
        img.src = resume.personal.profilePhotoUrl;
        img.alt = fullName;
        img.style.width = '100%';
        img.style.height = '100%';
        img.style.objectFit = 'cover';
        photoDiv.appendChild(img);
        inner.appendChild(photoDiv);
      }

      const details = document.createElement('div');
      details.className = 'header-details';
      
      const name = document.createElement('h1');
      name.className = 'header-name';
      name.style.fontSize = renderConfig.nameSize;
      name.textContent = fullName;
      details.appendChild(name);

      const head = document.createElement('p');
      head.className = 'header-headline';
      head.textContent = headline;
      details.appendChild(head);

      // Contact row
      const contacts = document.createElement('div');
      contacts.className = `contact-row ${renderConfig.contactRow === 'centered' ? 'centered' : ''}`;
      
      const detailsList = [resume.personal.location, resume.personal.phone, resume.personal.email].filter(Boolean);
      detailsList.forEach((text, i) => {
        const item = document.createElement('span');
        item.className = 'contact-item';
        if (i > 0) {
          const dot = document.createElement('span');
          dot.className = 'contact-dot';
          item.appendChild(dot);
        }
        const label = document.createElement('span');
        label.textContent = text;
        item.appendChild(label);
        contacts.appendChild(item);
      });
      details.appendChild(contacts);
      inner.appendChild(details);
      header.appendChild(inner);
      
      return header;
    }

    // MAIN SECTIONS CONSTRUCTOR
    function buildSection(key) {
      if (key === 'summary') {
        const container = document.createElement('div');
        container.className = 'section-wrapper';
        container.appendChild(renderHeading('Professional Summary', renderConfig, accent));
        
        const p = document.createElement('p');
        p.className = 'skill-plain-list';
        p.style.lineHeight = '1.6';
        p.style.whiteSpace = 'pre-wrap';
        p.textContent = resume.summary || 'Summary details appear here...';
        container.appendChild(p);
        return container;
      }
      if (key === 'experience') {
        return renderExperience(resume.experience, renderConfig, accent);
      }
      if (key === 'projects') {
        return renderProjects(resume.projects, renderConfig, accent);
      }
      if (key === 'skills') {
        return renderSkills(resume.skills, renderConfig, accent);
      }
      if (key === 'education') {
        return renderEducation(resume.education, renderConfig, accent);
      }
      return null;
    }

    // COMPILE LAYOUT STRUCTURES
    if (renderConfig.hasSidebar) {
      // Split Sidebar Layout
      const layoutWrapper = document.createElement('div');
      layoutWrapper.className = 'resume-layout-split';

      // Sidebar column
      const sidebar = document.createElement('div');
      sidebar.className = `sidebar ${renderConfig.sidebarSide === 'right' ? 'sidebar-right' : ''}`;
      
      // Sidebar Photo
      if (resume.personal.profilePhotoUrl) {
        const photoDiv = document.createElement('div');
        photoDiv.className = `profile-photo photo-${renderConfig.profilePhotoShape}`;
        photoDiv.style.width = renderConfig.profilePhotoSize;
        photoDiv.style.height = renderConfig.profilePhotoSize;
        photoDiv.style.margin = '0 auto 25px auto';
        
        const img = document.createElement('img');
        img.src = resume.personal.profilePhotoUrl;
        img.alt = fullName;
        img.style.width = '100%';
        img.style.height = '100%';
        img.style.objectFit = 'cover';
        photoDiv.appendChild(img);
        sidebar.appendChild(photoDiv);
      } else {
        const iconDiv = document.createElement('div');
        iconDiv.className = 'profile-photo photo-rounded';
        iconDiv.style.width = '70px';
        iconDiv.style.height = '70px';
        iconDiv.style.margin = '0 auto 25px auto';
        iconDiv.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
        iconDiv.style.display = 'flex';
        iconDiv.style.alignItems = 'center';
        iconDiv.style.justifyContent = 'center';
        
        const img = document.createElement('img');
        img.src = template.icon || '/icons/icon-resume.png';
        img.style.width = '32px';
        img.style.height = '32px';
        img.style.opacity = '0.15';
        iconDiv.appendChild(img);
        sidebar.appendChild(iconDiv);
      }

      renderConfig.sidebarSections.forEach(sectionKey => {
        const el = buildSection(sectionKey);
        if (el) sidebar.appendChild(el);
      });

      // Main Column
      const main = document.createElement('div');
      main.className = 'main-content';

      // Personal details header on top of Main for split templates (unless isDarkSidebar handles it)
      if (layout !== 'sidebar-dark' && layout !== 'sidebar-dark-right' && layout !== 'sidebar-circles') {
        main.appendChild(buildHeader(false));
      } else {
        // Dark sidebars place name/details inside main content top as simplified block
        const detailsBlock = document.createElement('div');
        detailsBlock.className = 'section-wrapper';
        detailsBlock.style.marginBottom = '30px';
        detailsBlock.style.borderBottom = '1px solid rgba(0, 0, 0, 0.05)';
        detailsBlock.style.paddingBottom = '25px';

        const name = document.createElement('h1');
        name.className = 'header-name';
        name.style.fontSize = '38px';
        name.textContent = fullName;
        detailsBlock.appendChild(name);

        const head = document.createElement('p');
        head.className = 'header-headline';
        head.textContent = headline;
        detailsBlock.appendChild(head);

        const contacts = document.createElement('div');
        contacts.className = 'contact-row';
        contacts.style.marginTop = '20px';
        [resume.personal.location, resume.personal.phone, resume.personal.email].filter(Boolean).forEach((text, i) => {
          const item = document.createElement('span');
          item.className = 'contact-item';
          if (i > 0) {
            const dot = document.createElement('span');
            dot.className = 'contact-dot';
            item.appendChild(dot);
          }
          const label = document.createElement('span');
          label.textContent = text;
          item.appendChild(label);
          contacts.appendChild(item);
        });
        detailsBlock.appendChild(contacts);
        main.appendChild(detailsBlock);
      }

      renderConfig.mainSections.forEach(sectionKey => {
        const el = buildSection(sectionKey);
        if (el) main.appendChild(el);
      });

      layoutWrapper.appendChild(sidebar);
      layoutWrapper.appendChild(main);
      root.appendChild(layoutWrapper);
    } else {
      // Single Column Layout
      const isCentered = layout === 'sleek-dark' || layout === 'banner-soft' || layout === 'modern-columns';
      root.appendChild(buildHeader(isCentered));

      const main = document.createElement('div');
      main.className = 'main-content';
      
      renderConfig.mainSections.forEach(sectionKey => {
        const el = buildSection(sectionKey);
        if (el) main.appendChild(el);
      });
      root.appendChild(main);
    }
  };
})();
