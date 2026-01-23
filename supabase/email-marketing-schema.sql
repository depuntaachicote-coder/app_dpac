-- =====================================================
-- Email Marketing Schema for De Punta a Chicote
-- =====================================================
-- Run this after the main schema.sql

-- Email Templates table
CREATE TABLE IF NOT EXISTS email_templates (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  subject TEXT NOT NULL,
  content TEXT NOT NULL,
  category TEXT CHECK (category IN ('introduccion', 'servicios', 'social', 'promocion', 'newsletter', 'custom')) NOT NULL,
  variables TEXT[] DEFAULT '{}',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Email Campaigns table
CREATE TABLE IF NOT EXISTS email_campaigns (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  subject TEXT NOT NULL,
  content TEXT NOT NULL,
  template_id UUID REFERENCES email_templates(id) ON DELETE SET NULL,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'sending', 'sent', 'cancelled')),
  scheduled_at TIMESTAMPTZ,
  sent_at TIMESTAMPTZ,
  total_recipients INTEGER DEFAULT 0,
  total_sent INTEGER DEFAULT 0,
  total_opened INTEGER DEFAULT 0,
  total_clicked INTEGER DEFAULT 0,
  total_bounced INTEGER DEFAULT 0,
  total_unsubscribed INTEGER DEFAULT 0,
  open_rate DECIMAL(5, 2) DEFAULT 0,
  click_rate DECIMAL(5, 2) DEFAULT 0,
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Email Recipients table (for tracking individual sends)
CREATE TABLE IF NOT EXISTS email_recipients (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  campaign_id UUID REFERENCES email_campaigns(id) ON DELETE CASCADE NOT NULL,
  email TEXT NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'delivered', 'opened', 'clicked', 'bounced', 'unsubscribed')),
  sent_at TIMESTAMPTZ,
  opened_at TIMESTAMPTZ,
  clicked_at TIMESTAMPTZ,
  open_count INTEGER DEFAULT 0,
  click_count INTEGER DEFAULT 0,
  user_agent TEXT,
  ip_address TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Email Subscribers table (for managing mailing list)
CREATE TABLE IF NOT EXISTS email_subscribers (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  company TEXT,
  source TEXT DEFAULT 'manual',
  tags TEXT[] DEFAULT '{}',
  is_subscribed BOOLEAN DEFAULT TRUE,
  subscribed_at TIMESTAMPTZ DEFAULT NOW(),
  unsubscribed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_email_campaigns_status ON email_campaigns(status);
CREATE INDEX IF NOT EXISTS idx_email_campaigns_created_at ON email_campaigns(created_at);
CREATE INDEX IF NOT EXISTS idx_email_recipients_campaign ON email_recipients(campaign_id);
CREATE INDEX IF NOT EXISTS idx_email_recipients_email ON email_recipients(email);
CREATE INDEX IF NOT EXISTS idx_email_subscribers_email ON email_subscribers(email);
CREATE INDEX IF NOT EXISTS idx_email_subscribers_subscribed ON email_subscribers(is_subscribed);

-- Enable RLS
ALTER TABLE email_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_recipients ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_subscribers ENABLE ROW LEVEL SECURITY;

-- RLS Policies (Admins only)
CREATE POLICY "Admins can manage email templates" ON email_templates
  FOR ALL USING (public.is_admin());

CREATE POLICY "Admins can manage email campaigns" ON email_campaigns
  FOR ALL USING (public.is_admin());

CREATE POLICY "Admins can manage email recipients" ON email_recipients
  FOR ALL USING (public.is_admin());

CREATE POLICY "Admins can manage email subscribers" ON email_subscribers
  FOR ALL USING (public.is_admin());

-- Insert default email templates
INSERT INTO email_templates (name, subject, category, content, variables) VALUES
(
  'Presentacion De Punta a Chicote',
  'Descubre De Punta a Chicote - Marketing para Hospedajes Turisticos',
  'introduccion',
  '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
    <div style="text-align: center; padding: 40px 20px; border-bottom: 2px solid #1a1a1a;">
      <h1 style="font-size: 28px; color: #1a1a1a; margin: 0;">De Punta a Chicote</h1>
      <p style="color: #666; margin-top: 10px;">Marketing Premium para Hospedajes Turisticos</p>
    </div>

    <div style="padding: 40px 20px;">
      <p style="color: #333; font-size: 16px; line-height: 1.6;">Hola {{nombre}},</p>

      <p style="color: #333; font-size: 16px; line-height: 1.6;">
        Somos <strong>De Punta a Chicote</strong>, una agencia especializada en marketing para
        hospedajes turisticos en Galicia. Combinamos fotografia profesional, video de alta
        calidad y estrategias de redes sociales para destacar tu alojamiento.
      </p>

      <h2 style="color: #1a1a1a; font-size: 20px; margin-top: 30px;">Nuestros Servicios:</h2>
      <ul style="color: #333; font-size: 16px; line-height: 1.8;">
        <li>Sesion fotografica profesional de tu hospedaje</li>
        <li>Video promocional cinematografico</li>
        <li>Presencia en nuestro ranking de mejores hospedajes</li>
        <li>Publicacion en Instagram, TikTok y YouTube</li>
        <li>Exposicion a miles de potenciales huespedes</li>
      </ul>

      <div style="text-align: center; margin-top: 40px;">
        <a href="{{url_contacto}}" style="display: inline-block; background: #1a1a1a; color: white; padding: 15px 40px; text-decoration: none; font-weight: bold;">
          Solicitar Informacion
        </a>
      </div>
    </div>

    <div style="background: #f5f5f5; padding: 30px 20px; text-align: center; border-top: 2px solid #1a1a1a;">
      <p style="color: #666; font-size: 14px; margin: 0;">
        VideoFoto360 by Antonio Presas | Pontevende by Noel Perez
      </p>
      <p style="color: #999; font-size: 12px; margin-top: 10px;">
        © 2024 De Punta a Chicote. Todos los derechos reservados.
      </p>
    </div>
  </div>',
  ARRAY['nombre', 'url_contacto']
),
(
  'Informacion de Servicios',
  '{{empresa}} - Tu Pack de Marketing Visual esta Listo',
  'servicios',
  '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
    <div style="text-align: center; padding: 40px 20px; border-bottom: 2px solid #1a1a1a;">
      <h1 style="font-size: 28px; color: #1a1a1a; margin: 0;">De Punta a Chicote</h1>
    </div>

    <div style="padding: 40px 20px;">
      <p style="color: #333; font-size: 16px; line-height: 1.6;">Hola {{nombre}},</p>

      <p style="color: #333; font-size: 16px; line-height: 1.6;">
        Nos complace informarte que hemos completado {{accion}} para <strong>{{empresa}}</strong>.
      </p>

      <div style="background: #f9f9f9; border-left: 4px solid #1a1a1a; padding: 20px; margin: 30px 0;">
        <h3 style="color: #1a1a1a; margin-top: 0;">Resumen:</h3>
        <p style="color: #666; margin-bottom: 0;">{{resumen}}</p>
      </div>

      <p style="color: #333; font-size: 16px; line-height: 1.6;">
        Puedes acceder a todo tu material desde tu panel de cliente:
      </p>

      <div style="text-align: center; margin-top: 30px;">
        <a href="{{url_dashboard}}" style="display: inline-block; background: #1a1a1a; color: white; padding: 15px 40px; text-decoration: none; font-weight: bold;">
          Acceder a Mi Panel
        </a>
      </div>
    </div>

    <div style="background: #f5f5f5; padding: 30px 20px; text-align: center; border-top: 2px solid #1a1a1a;">
      <p style="color: #999; font-size: 12px;">
        © 2024 De Punta a Chicote. Todos los derechos reservados.
      </p>
    </div>
  </div>',
  ARRAY['nombre', 'empresa', 'accion', 'resumen', 'url_dashboard']
),
(
  'Nueva Publicacion en RRSS',
  '¡{{empresa}} ya esta en nuestras redes!',
  'social',
  '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
    <div style="text-align: center; padding: 40px 20px; border-bottom: 2px solid #1a1a1a;">
      <h1 style="font-size: 28px; color: #1a1a1a; margin: 0;">De Punta a Chicote</h1>
      <p style="color: #666; margin-top: 10px;">Nueva Publicacion</p>
    </div>

    <div style="padding: 40px 20px;">
      <p style="color: #333; font-size: 16px; line-height: 1.6;">Hola {{nombre}},</p>

      <p style="color: #333; font-size: 16px; line-height: 1.6;">
        ¡Excelentes noticias! Acabamos de publicar contenido de <strong>{{empresa}}</strong>
        en nuestras redes sociales.
      </p>

      <div style="background: #1a1a1a; color: white; padding: 30px; margin: 30px 0; text-align: center;">
        <p style="font-size: 18px; margin: 0;">{{plataforma}}</p>
        <p style="font-size: 14px; color: #ccc; margin-top: 10px;">{{descripcion}}</p>
      </div>

      <div style="text-align: center;">
        <a href="{{url_publicacion}}" style="display: inline-block; background: #1a1a1a; color: white; padding: 15px 40px; text-decoration: none; font-weight: bold;">
          Ver Publicacion
        </a>
      </div>

      <p style="color: #666; font-size: 14px; margin-top: 30px; text-align: center;">
        Comparte con tus seguidores para maximizar el alcance
      </p>
    </div>

    <div style="background: #f5f5f5; padding: 30px 20px; text-align: center; border-top: 2px solid #1a1a1a;">
      <p style="color: #999; font-size: 12px;">
        © 2024 De Punta a Chicote. Todos los derechos reservados.
      </p>
    </div>
  </div>',
  ARRAY['nombre', 'empresa', 'plataforma', 'descripcion', 'url_publicacion']
),
(
  'Newsletter Mensual',
  'Novedades De Punta a Chicote - {{mes}} {{ano}}',
  'newsletter',
  '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
    <div style="text-align: center; padding: 40px 20px; border-bottom: 2px solid #1a1a1a;">
      <h1 style="font-size: 28px; color: #1a1a1a; margin: 0;">De Punta a Chicote</h1>
      <p style="color: #666; margin-top: 10px;">Newsletter {{mes}} {{ano}}</p>
    </div>

    <div style="padding: 40px 20px;">
      <p style="color: #333; font-size: 16px; line-height: 1.6;">Hola {{nombre}},</p>

      <p style="color: #333; font-size: 16px; line-height: 1.6;">
        Te traemos las ultimas novedades del mundo del turismo en Galicia y los
        hospedajes que hemos destacado este mes.
      </p>

      <h2 style="color: #1a1a1a; font-size: 20px; border-bottom: 2px solid #1a1a1a; padding-bottom: 10px;">
        Hospedajes Destacados
      </h2>

      {{contenido_destacados}}

      <h2 style="color: #1a1a1a; font-size: 20px; border-bottom: 2px solid #1a1a1a; padding-bottom: 10px; margin-top: 40px;">
        Proximos Eventos
      </h2>

      {{contenido_eventos}}

      <div style="text-align: center; margin-top: 40px;">
        <a href="{{url_ranking}}" style="display: inline-block; background: #1a1a1a; color: white; padding: 15px 40px; text-decoration: none; font-weight: bold;">
          Ver Ranking Completo
        </a>
      </div>
    </div>

    <div style="background: #f5f5f5; padding: 30px 20px; text-align: center; border-top: 2px solid #1a1a1a;">
      <p style="color: #999; font-size: 12px;">
        © 2024 De Punta a Chicote. Todos los derechos reservados.
      </p>
      <p style="color: #999; font-size: 11px; margin-top: 10px;">
        <a href="{{url_unsubscribe}}" style="color: #999;">Darse de baja</a>
      </p>
    </div>
  </div>',
  ARRAY['nombre', 'mes', 'ano', 'contenido_destacados', 'contenido_eventos', 'url_ranking', 'url_unsubscribe']
);
