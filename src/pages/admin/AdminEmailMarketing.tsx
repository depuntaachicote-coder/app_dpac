import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  Mail,
  Send,
  Users,
  BarChart3,
  FileText,
  Plus,
  Eye,
  MousePointer,
  Check,
  Clock,
  X,
  ChevronRight,
  Search,
} from 'lucide-react'
import { supabase } from '../../lib/supabase'
import type { EmailCampaign, EmailTemplate, EmailSubscriber } from '../../types/database'
import LoadingSpinner from '../../components/ui/LoadingSpinner'

type TabType = 'dashboard' | 'campaigns' | 'templates' | 'subscribers'

const statusConfig = {
  draft: { label: 'Borrador', color: 'bg-gray-100 text-gray-700', icon: FileText },
  scheduled: { label: 'Programada', color: 'bg-blue-100 text-blue-700', icon: Clock },
  sending: { label: 'Enviando', color: 'bg-yellow-100 text-yellow-700', icon: Send },
  sent: { label: 'Enviada', color: 'bg-green-100 text-green-700', icon: Check },
  cancelled: { label: 'Cancelada', color: 'bg-red-100 text-red-700', icon: X },
}

const categoryConfig = {
  introduccion: { label: 'Introduccion', color: 'bg-purple-100 text-purple-700' },
  servicios: { label: 'Servicios', color: 'bg-blue-100 text-blue-700' },
  social: { label: 'Redes Sociales', color: 'bg-pink-100 text-pink-700' },
  promocion: { label: 'Promocion', color: 'bg-orange-100 text-orange-700' },
  newsletter: { label: 'Newsletter', color: 'bg-green-100 text-green-700' },
  custom: { label: 'Personalizada', color: 'bg-gray-100 text-gray-700' },
}

export default function AdminEmailMarketing() {
  const [activeTab, setActiveTab] = useState<TabType>('dashboard')
  const [campaigns, setCampaigns] = useState<EmailCampaign[]>([])
  const [templates, setTemplates] = useState<EmailTemplate[]>([])
  const [subscribers, setSubscribers] = useState<EmailSubscriber[]>([])
  const [loading, setLoading] = useState(true)
  const [showCampaignModal, setShowCampaignModal] = useState(false)
  const [showSubscriberModal, setShowSubscriberModal] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate | null>(null)
  const [searchTerm, setSearchTerm] = useState('')

  // Campaign form state
  const [campaignForm, setCampaignForm] = useState({
    name: '',
    subject: '',
    content: '',
    template_id: '',
  })

  // Subscriber form state
  const [subscriberForm, setSubscriberForm] = useState({
    email: '',
    name: '',
    company: '',
    tags: '',
  })

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    try {
      const [campaignsRes, templatesRes, subscribersRes] = await Promise.all([
        supabase.from('email_campaigns').select('*').order('created_at', { ascending: false }),
        supabase.from('email_templates').select('*').order('category'),
        supabase.from('email_subscribers').select('*').order('created_at', { ascending: false }),
      ])

      if (campaignsRes.data) setCampaigns(campaignsRes.data as EmailCampaign[])
      if (templatesRes.data) setTemplates(templatesRes.data as EmailTemplate[])
      if (subscribersRes.data) setSubscribers(subscribersRes.data as EmailSubscriber[])
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateCampaign = async () => {
    if (!campaignForm.name || !campaignForm.subject || !campaignForm.content) return

    try {
      const { error } = await supabase.from('email_campaigns').insert({
        name: campaignForm.name,
        subject: campaignForm.subject,
        content: campaignForm.content,
        template_id: campaignForm.template_id || null,
        status: 'draft',
      } as never)

      if (error) throw error

      setCampaignForm({ name: '', subject: '', content: '', template_id: '' })
      setShowCampaignModal(false)
      fetchData()
    } catch (error) {
      console.error('Error creating campaign:', error)
    }
  }

  const handleAddSubscriber = async () => {
    if (!subscriberForm.email) return

    try {
      const { error } = await supabase.from('email_subscribers').insert({
        email: subscriberForm.email,
        name: subscriberForm.name || null,
        company: subscriberForm.company || null,
        tags: subscriberForm.tags ? subscriberForm.tags.split(',').map((t) => t.trim()) : [],
        source: 'manual',
      } as never)

      if (error) throw error

      setSubscriberForm({ email: '', name: '', company: '', tags: '' })
      setShowSubscriberModal(false)
      fetchData()
    } catch (error) {
      console.error('Error adding subscriber:', error)
    }
  }

  const handleUseTemplate = (template: EmailTemplate) => {
    setCampaignForm({
      ...campaignForm,
      name: `Campana - ${template.name}`,
      subject: template.subject,
      content: template.content,
      template_id: template.id,
    })
    setSelectedTemplate(template)
    setShowCampaignModal(true)
  }

  // Calculate metrics
  const totalSent = campaigns.reduce((sum, c) => sum + c.total_sent, 0)
  const avgOpenRate = campaigns.length > 0
    ? campaigns.reduce((sum, c) => sum + c.open_rate, 0) / campaigns.length
    : 0
  const avgClickRate = campaigns.length > 0
    ? campaigns.reduce((sum, c) => sum + c.click_rate, 0) / campaigns.length
    : 0

  const filteredSubscribers = subscribers.filter(
    (s) =>
      s.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.company?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const tabs = [
    { id: 'dashboard' as const, label: 'Dashboard', icon: BarChart3 },
    { id: 'campaigns' as const, label: 'Campanas', icon: Send },
    { id: 'templates' as const, label: 'Plantillas', icon: FileText },
    { id: 'subscribers' as const, label: 'Suscriptores', icon: Users },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold text-primary-900">Email Marketing</h1>
          <p className="mt-1 text-primary-600">Gestiona campanas y comunicaciones</p>
        </div>
        <button
          onClick={() => setShowCampaignModal(true)}
          className="inline-flex items-center gap-2 px-6 py-3 bg-primary-900 text-white hover:bg-primary-800 transition-colors"
        >
          <Plus size={20} />
          Nueva Campana
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-primary-200">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-6 py-3 font-medium transition-colors border-b-2 -mb-px ${
              activeTab === tab.id
                ? 'border-primary-900 text-primary-900'
                : 'border-transparent text-primary-500 hover:text-primary-700'
            }`}
          >
            <tab.icon size={18} />
            {tab.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <LoadingSpinner size="lg" />
        </div>
      ) : (
        <>
          {/* Dashboard Tab */}
          {activeTab === 'dashboard' && (
            <div className="space-y-6">
              {/* Metrics */}
              <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                <div className="bg-white border border-primary-200 p-6">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-primary-100 rounded-lg">
                      <Send size={24} className="text-primary-600" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-primary-900">{campaigns.length}</p>
                      <p className="text-sm text-primary-500">Campanas</p>
                    </div>
                  </div>
                </div>
                <div className="bg-white border border-primary-200 p-6">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-blue-100 rounded-lg">
                      <Mail size={24} className="text-blue-600" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-primary-900">{totalSent}</p>
                      <p className="text-sm text-primary-500">Emails enviados</p>
                    </div>
                  </div>
                </div>
                <div className="bg-white border border-primary-200 p-6">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-green-100 rounded-lg">
                      <Eye size={24} className="text-green-600" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-primary-900">{avgOpenRate.toFixed(1)}%</p>
                      <p className="text-sm text-primary-500">Tasa apertura</p>
                    </div>
                  </div>
                </div>
                <div className="bg-white border border-primary-200 p-6">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-purple-100 rounded-lg">
                      <MousePointer size={24} className="text-purple-600" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-primary-900">{avgClickRate.toFixed(1)}%</p>
                      <p className="text-sm text-primary-500">Tasa clicks</p>
                    </div>
                  </div>
                </div>
                <div className="bg-white border border-primary-200 p-6">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-orange-100 rounded-lg">
                      <Users size={24} className="text-orange-600" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-primary-900">
                        {subscribers.filter((s) => s.is_subscribed).length}
                      </p>
                      <p className="text-sm text-primary-500">Suscriptores</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Recent Campaigns */}
              <div className="bg-white border border-primary-200">
                <div className="p-6 border-b border-primary-200">
                  <h2 className="font-display text-xl font-semibold text-primary-900">
                    Campanas Recientes
                  </h2>
                </div>
                <div className="divide-y divide-primary-100">
                  {campaigns.slice(0, 5).map((campaign) => {
                    const status = statusConfig[campaign.status]
                    return (
                      <div
                        key={campaign.id}
                        className="p-6 flex items-center justify-between hover:bg-primary-50"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-3">
                            <h3 className="font-medium text-primary-900">{campaign.name}</h3>
                            <span className={`px-2 py-0.5 text-xs font-medium ${status.color}`}>
                              {status.label}
                            </span>
                          </div>
                          <p className="text-sm text-primary-500 mt-1">{campaign.subject}</p>
                        </div>
                        <div className="flex items-center gap-8 text-sm">
                          <div className="text-center">
                            <p className="font-semibold text-primary-900">{campaign.total_sent}</p>
                            <p className="text-primary-500">Enviados</p>
                          </div>
                          <div className="text-center">
                            <p className="font-semibold text-green-600">{campaign.open_rate}%</p>
                            <p className="text-primary-500">Aperturas</p>
                          </div>
                          <div className="text-center">
                            <p className="font-semibold text-blue-600">{campaign.click_rate}%</p>
                            <p className="text-primary-500">Clicks</p>
                          </div>
                          <ChevronRight size={20} className="text-primary-400" />
                        </div>
                      </div>
                    )
                  })}
                  {campaigns.length === 0 && (
                    <div className="p-12 text-center">
                      <Mail size={48} className="mx-auto text-primary-300 mb-4" />
                      <p className="text-primary-600">No hay campanas todavia</p>
                      <button
                        onClick={() => setShowCampaignModal(true)}
                        className="mt-4 text-primary-900 font-medium hover:underline"
                      >
                        Crear primera campana
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Campaigns Tab */}
          {activeTab === 'campaigns' && (
            <div className="bg-white border border-primary-200">
              <div className="p-6 border-b border-primary-200 flex items-center justify-between">
                <h2 className="font-display text-xl font-semibold text-primary-900">
                  Todas las Campanas
                </h2>
                <div className="flex items-center gap-4">
                  <select className="px-4 py-2 border border-primary-200 focus:border-primary-900 focus:outline-none">
                    <option value="">Todos los estados</option>
                    <option value="draft">Borrador</option>
                    <option value="scheduled">Programada</option>
                    <option value="sent">Enviada</option>
                  </select>
                </div>
              </div>
              <div className="divide-y divide-primary-100">
                {campaigns.map((campaign, index) => {
                  const status = statusConfig[campaign.status]
                  return (
                    <motion.div
                      key={campaign.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: index * 0.05 }}
                      className="p-6 hover:bg-primary-50 cursor-pointer"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3">
                            <h3 className="font-medium text-primary-900">{campaign.name}</h3>
                            <span className={`px-2 py-0.5 text-xs font-medium ${status.color}`}>
                              {status.label}
                            </span>
                          </div>
                          <p className="text-sm text-primary-600 mt-1">{campaign.subject}</p>
                          <p className="text-xs text-primary-400 mt-2">
                            Creada: {new Date(campaign.created_at).toLocaleDateString('es-ES')}
                            {campaign.sent_at && (
                              <> | Enviada: {new Date(campaign.sent_at).toLocaleDateString('es-ES')}</>
                            )}
                          </p>
                        </div>
                        <div className="flex items-center gap-6">
                          <div className="grid grid-cols-4 gap-6 text-center text-sm">
                            <div>
                              <p className="font-semibold text-primary-900">{campaign.total_recipients}</p>
                              <p className="text-xs text-primary-500">Destinatarios</p>
                            </div>
                            <div>
                              <p className="font-semibold text-primary-900">{campaign.total_sent}</p>
                              <p className="text-xs text-primary-500">Enviados</p>
                            </div>
                            <div>
                              <p className="font-semibold text-green-600">{campaign.total_opened}</p>
                              <p className="text-xs text-primary-500">Abiertos</p>
                            </div>
                            <div>
                              <p className="font-semibold text-blue-600">{campaign.total_clicked}</p>
                              <p className="text-xs text-primary-500">Clicks</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )
                })}
                {campaigns.length === 0 && (
                  <div className="p-12 text-center">
                    <Send size={48} className="mx-auto text-primary-300 mb-4" />
                    <p className="text-primary-600">No hay campanas</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Templates Tab */}
          {activeTab === 'templates' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {templates.map((template, index) => {
                const category = categoryConfig[template.category]
                return (
                  <motion.div
                    key={template.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="bg-white border border-primary-200 hover:border-primary-400 transition-colors"
                  >
                    <div className="p-6">
                      <div className="flex items-start justify-between">
                        <div>
                          <span className={`px-2 py-0.5 text-xs font-medium ${category.color}`}>
                            {category.label}
                          </span>
                          <h3 className="font-display text-lg font-semibold text-primary-900 mt-2">
                            {template.name}
                          </h3>
                          <p className="text-sm text-primary-600 mt-1">{template.subject}</p>
                        </div>
                        <FileText size={24} className="text-primary-300" />
                      </div>

                      {template.variables.length > 0 && (
                        <div className="mt-4">
                          <p className="text-xs text-primary-500 mb-2">Variables:</p>
                          <div className="flex flex-wrap gap-1">
                            {template.variables.map((variable) => (
                              <span
                                key={variable}
                                className="px-2 py-0.5 bg-primary-100 text-primary-600 text-xs"
                              >
                                {`{{${variable}}}`}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="mt-6 flex gap-3">
                        <button
                          onClick={() => handleUseTemplate(template)}
                          className="flex-1 px-4 py-2 bg-primary-900 text-white text-sm hover:bg-primary-800 transition-colors"
                        >
                          Usar plantilla
                        </button>
                        <button
                          onClick={() => setSelectedTemplate(template)}
                          className="px-4 py-2 border border-primary-200 text-primary-700 text-sm hover:bg-primary-50 transition-colors"
                        >
                          Vista previa
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )
              })}
              {templates.length === 0 && (
                <div className="col-span-2 p-12 text-center bg-white border border-primary-200">
                  <FileText size={48} className="mx-auto text-primary-300 mb-4" />
                  <p className="text-primary-600">No hay plantillas disponibles</p>
                  <p className="text-sm text-primary-400 mt-1">
                    Ejecuta el script email-marketing-schema.sql para crear las plantillas
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Subscribers Tab */}
          {activeTab === 'subscribers' && (
            <div className="bg-white border border-primary-200">
              <div className="p-6 border-b border-primary-200 flex items-center justify-between">
                <h2 className="font-display text-xl font-semibold text-primary-900">
                  Lista de Suscriptores ({subscribers.filter((s) => s.is_subscribed).length} activos)
                </h2>
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <Search
                      size={18}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-primary-400"
                    />
                    <input
                      type="text"
                      placeholder="Buscar..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 pr-4 py-2 border border-primary-200 focus:border-primary-900 focus:outline-none"
                    />
                  </div>
                  <button
                    onClick={() => setShowSubscriberModal(true)}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-primary-900 text-white hover:bg-primary-800 transition-colors"
                  >
                    <Plus size={18} />
                    Anadir
                  </button>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-primary-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-primary-500 uppercase tracking-wider">
                        Email
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-primary-500 uppercase tracking-wider">
                        Nombre
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-primary-500 uppercase tracking-wider">
                        Empresa
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-primary-500 uppercase tracking-wider">
                        Tags
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-primary-500 uppercase tracking-wider">
                        Estado
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-primary-500 uppercase tracking-wider">
                        Fecha
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-primary-100">
                    {filteredSubscribers.map((subscriber) => (
                      <tr key={subscriber.id} className="hover:bg-primary-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-primary-900">
                          {subscriber.email}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-primary-600">
                          {subscriber.name || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-primary-600">
                          {subscriber.company || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex gap-1">
                            {subscriber.tags.slice(0, 2).map((tag) => (
                              <span
                                key={tag}
                                className="px-2 py-0.5 bg-primary-100 text-primary-600 text-xs"
                              >
                                {tag}
                              </span>
                            ))}
                            {subscriber.tags.length > 2 && (
                              <span className="text-xs text-primary-400">
                                +{subscriber.tags.length - 2}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`px-2 py-0.5 text-xs font-medium ${
                              subscriber.is_subscribed
                                ? 'bg-green-100 text-green-700'
                                : 'bg-red-100 text-red-700'
                            }`}
                          >
                            {subscriber.is_subscribed ? 'Activo' : 'Baja'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-primary-500">
                          {new Date(subscriber.subscribed_at).toLocaleDateString('es-ES')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {filteredSubscribers.length === 0 && (
                  <div className="p-12 text-center">
                    <Users size={48} className="mx-auto text-primary-300 mb-4" />
                    <p className="text-primary-600">
                      {searchTerm ? 'No se encontraron resultados' : 'No hay suscriptores'}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </>
      )}

      {/* Campaign Modal */}
      {showCampaignModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => setShowCampaignModal(false)}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white w-full max-w-2xl max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 border-b border-primary-200 flex items-center justify-between">
              <h2 className="font-display text-2xl font-bold text-primary-900">
                {selectedTemplate ? `Nueva Campana - ${selectedTemplate.name}` : 'Nueva Campana'}
              </h2>
              <button
                onClick={() => {
                  setShowCampaignModal(false)
                  setSelectedTemplate(null)
                  setCampaignForm({ name: '', subject: '', content: '', template_id: '' })
                }}
                className="p-2 text-primary-400 hover:text-primary-900"
              >
                <X size={24} />
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div>
                <label className="block text-sm font-medium text-primary-700 mb-2">
                  Nombre de la campana
                </label>
                <input
                  type="text"
                  value={campaignForm.name}
                  onChange={(e) => setCampaignForm({ ...campaignForm, name: e.target.value })}
                  placeholder="Ej: Newsletter Enero 2024"
                  className="w-full px-4 py-3 border border-primary-200 focus:border-primary-900 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-primary-700 mb-2">
                  Asunto del email
                </label>
                <input
                  type="text"
                  value={campaignForm.subject}
                  onChange={(e) => setCampaignForm({ ...campaignForm, subject: e.target.value })}
                  placeholder="Ej: Descubre los mejores hospedajes de Galicia"
                  className="w-full px-4 py-3 border border-primary-200 focus:border-primary-900 focus:outline-none"
                />
              </div>

              {!selectedTemplate && (
                <div>
                  <label className="block text-sm font-medium text-primary-700 mb-2">
                    Usar plantilla (opcional)
                  </label>
                  <select
                    value={campaignForm.template_id}
                    onChange={(e) => {
                      const template = templates.find((t) => t.id === e.target.value)
                      if (template) {
                        setCampaignForm({
                          ...campaignForm,
                          template_id: e.target.value,
                          subject: template.subject,
                          content: template.content,
                        })
                      }
                    }}
                    className="w-full px-4 py-3 border border-primary-200 focus:border-primary-900 focus:outline-none"
                  >
                    <option value="">Sin plantilla</option>
                    {templates.map((template) => (
                      <option key={template.id} value={template.id}>
                        {template.name} ({categoryConfig[template.category].label})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-primary-700 mb-2">
                  Contenido HTML
                </label>
                <textarea
                  value={campaignForm.content}
                  onChange={(e) => setCampaignForm({ ...campaignForm, content: e.target.value })}
                  rows={12}
                  placeholder="<div>Contenido del email...</div>"
                  className="w-full px-4 py-3 border border-primary-200 focus:border-primary-900 focus:outline-none font-mono text-sm"
                />
              </div>

              {selectedTemplate && selectedTemplate.variables.length > 0 && (
                <div className="bg-primary-50 p-4 border border-primary-200">
                  <p className="text-sm font-medium text-primary-700 mb-2">
                    Variables disponibles:
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {selectedTemplate.variables.map((variable) => (
                      <code key={variable} className="px-2 py-1 bg-white border text-sm">
                        {`{{${variable}}}`}
                      </code>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="p-6 border-t border-primary-200 flex justify-end gap-4">
              <button
                onClick={() => {
                  setShowCampaignModal(false)
                  setSelectedTemplate(null)
                  setCampaignForm({ name: '', subject: '', content: '', template_id: '' })
                }}
                className="px-6 py-3 border border-primary-200 text-primary-700 hover:bg-primary-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleCreateCampaign}
                disabled={!campaignForm.name || !campaignForm.subject || !campaignForm.content}
                className="px-6 py-3 bg-primary-900 text-white hover:bg-primary-800 transition-colors disabled:opacity-50"
              >
                Crear Campana
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Subscriber Modal */}
      {showSubscriberModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => setShowSubscriberModal(false)}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white w-full max-w-md"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 border-b border-primary-200 flex items-center justify-between">
              <h2 className="font-display text-xl font-bold text-primary-900">
                Anadir Suscriptor
              </h2>
              <button
                onClick={() => setShowSubscriberModal(false)}
                className="p-2 text-primary-400 hover:text-primary-900"
              >
                <X size={24} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-primary-700 mb-2">
                  Email *
                </label>
                <input
                  type="email"
                  value={subscriberForm.email}
                  onChange={(e) => setSubscriberForm({ ...subscriberForm, email: e.target.value })}
                  placeholder="correo@ejemplo.com"
                  className="w-full px-4 py-3 border border-primary-200 focus:border-primary-900 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-primary-700 mb-2">
                  Nombre
                </label>
                <input
                  type="text"
                  value={subscriberForm.name}
                  onChange={(e) => setSubscriberForm({ ...subscriberForm, name: e.target.value })}
                  placeholder="Nombre completo"
                  className="w-full px-4 py-3 border border-primary-200 focus:border-primary-900 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-primary-700 mb-2">
                  Empresa
                </label>
                <input
                  type="text"
                  value={subscriberForm.company}
                  onChange={(e) => setSubscriberForm({ ...subscriberForm, company: e.target.value })}
                  placeholder="Nombre del hospedaje o empresa"
                  className="w-full px-4 py-3 border border-primary-200 focus:border-primary-900 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-primary-700 mb-2">
                  Tags (separados por coma)
                </label>
                <input
                  type="text"
                  value={subscriberForm.tags}
                  onChange={(e) => setSubscriberForm({ ...subscriberForm, tags: e.target.value })}
                  placeholder="hotel, pontevedra, cliente"
                  className="w-full px-4 py-3 border border-primary-200 focus:border-primary-900 focus:outline-none"
                />
              </div>
            </div>

            <div className="p-6 border-t border-primary-200 flex justify-end gap-4">
              <button
                onClick={() => setShowSubscriberModal(false)}
                className="px-6 py-3 border border-primary-200 text-primary-700 hover:bg-primary-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleAddSubscriber}
                disabled={!subscriberForm.email}
                className="px-6 py-3 bg-primary-900 text-white hover:bg-primary-800 transition-colors disabled:opacity-50"
              >
                Anadir Suscriptor
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Template Preview Modal */}
      {selectedTemplate && !showCampaignModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => setSelectedTemplate(null)}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white w-full max-w-3xl max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 border-b border-primary-200 flex items-center justify-between">
              <div>
                <span
                  className={`px-2 py-0.5 text-xs font-medium ${
                    categoryConfig[selectedTemplate.category].color
                  }`}
                >
                  {categoryConfig[selectedTemplate.category].label}
                </span>
                <h2 className="font-display text-xl font-bold text-primary-900 mt-2">
                  {selectedTemplate.name}
                </h2>
              </div>
              <button
                onClick={() => setSelectedTemplate(null)}
                className="p-2 text-primary-400 hover:text-primary-900"
              >
                <X size={24} />
              </button>
            </div>

            <div className="p-6">
              <p className="text-sm text-primary-500 mb-4">
                <strong>Asunto:</strong> {selectedTemplate.subject}
              </p>
              <div
                className="border border-primary-200 p-4"
                dangerouslySetInnerHTML={{ __html: selectedTemplate.content }}
              />
            </div>

            <div className="p-6 border-t border-primary-200 flex justify-end gap-4">
              <button
                onClick={() => setSelectedTemplate(null)}
                className="px-6 py-3 border border-primary-200 text-primary-700 hover:bg-primary-50 transition-colors"
              >
                Cerrar
              </button>
              <button
                onClick={() => handleUseTemplate(selectedTemplate)}
                className="px-6 py-3 bg-primary-900 text-white hover:bg-primary-800 transition-colors"
              >
                Usar esta plantilla
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  )
}
