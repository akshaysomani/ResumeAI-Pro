-- RESUMEAI PRO - 003_EDITOR_THEME_CONFIG.SQL
-- Migration script to add granular custom layout theme overrides.

alter table public.resumes 
  add column if not exists theme_config jsonb default '{
    "primaryColor": "#4f46e5",
    "accentColor": "#818cf8",
    "backgroundColor": "#ffffff",
    "headingStyle": "bold",
    "dividerStyle": "solid",
    "iconStyle": "circle",
    "sectionSpacing": "normal",
    "borderRadius": "md",
    "fontSize": "base",
    "headingSize": "lg",
    "lineHeight": "normal",
    "letterSpacing": "normal",
    "paragraphSpacing": "normal",
    "alignment": "left"
  }'::jsonb;
