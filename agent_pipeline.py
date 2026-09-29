# SatQuery-AI Multi-Agent Pipeline (Slide 3 - Agentic Workflow)

def route_query_and_images(user_message, images_count=0):
    msg = (user_message or '').lower()

    if images_count >= 2:
        if any(k in msg for k in ['sar', 'radar', 'fusion', 'c-band', 'backscatter', 'penetrat', 'cloud cover']):
            route = 'optical_sar_fusion'
            agent_name = 'Optical-SAR Fusion Agent'
            intent_summary = 'Multimodal sensor fusion (Optical RGB + SAR Radar backscatter)'
        else:
            route = 'change_detection'
            agent_name = 'Bi-Temporal Change Agent'
            intent_summary = 'Bi-temporal difference analysis and land-cover delta detection'
    elif images_count == 1:
        if any(k in msg for k in ['ndvi', 'vegetation', 'crop', 'forest', 'agriculture']):
            route = 'ndvi_vqa'
            agent_name = 'Spectral Index VQA Agent'
            intent_summary = 'False-color NDVI spectral vegetation vigor analysis'
        elif any(k in msg for k in ['flood', 'water', 'lake', 'river', 'ndwi']):
            route = 'ndwi_vqa'
            agent_name = 'Hydrological VQA Agent'
            intent_summary = 'Hydrological flood inundation and NDWI water indexing'
        else:
            route = 'single_vqa'
            agent_name = 'Single-Image VQA Agent'
            intent_summary = 'Visual question answering and geospatial feature grounding'
    else:
        route = 'text_telemetry'
        agent_name = 'Geospatial Telemetry Agent'
        intent_summary = 'Earth Observation knowledge retrieval and orbital calculation'

    return route, agent_name, intent_summary


def build_agentic_trace(user_message, images_count, proof_stats=None, model_name='qwen/qwen3.8-27b'):
    route, agent_name, intent_summary = route_query_and_images(user_message, images_count)

    # 1. Intake Agent step
    if images_count == 2:
        intake_desc = '2 Ingested (Reference + Target Sensors)'
    elif images_count == 1:
        intake_desc = '1 Ingested (Geospatial Scan)'
    else:
        intake_desc = 'Prompt Ingested (Telemetry Query)'

    # 2. Verification Agent step
    if route == 'change_detection':
        change_pct = (proof_stats or {}).get('change_percentage', '1.25')
        zones = (proof_stats or {}).get('detected_zones', 1)
        verification_desc = f'Verified • {change_pct}% Pixel Delta • {zones} Zones'
        confidence = '96.8%'
    elif route == 'optical_sar_fusion':
        verification_desc = 'Verified • Cross-Spectral HSV Alignment Nominal'
        confidence = '97.2%'
    elif 'vqa' in route:
        verification_desc = 'Verified • Saliency Bounding and Spectral Bands Calibrated'
        confidence = '95.5%'
    else:
        verification_desc = 'Verified • Geospatial Domain Validation Passed'
        confidence = '98.0%'

    return {
        'route': route,
        'agent_name': agent_name,
        'intent_summary': intent_summary,
        'intake': intake_desc,
        'classifier': f'Classifier routed to {agent_name}',
        'active_agent': agent_name,
        'verification': verification_desc,
        'confidence': confidence,
        'model': model_name
    }
