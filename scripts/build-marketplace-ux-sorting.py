from pathlib import Path
root=Path(__file__).resolve().parents[1]
evidence=Path(r'C:\LUVIPRO_Workspace\readiness\ux_marketplace_20261101')
read=(evidence/'luvipro_marketplace_read_v1_original.sql').read_text()
state=(evidence/'luvipro_marketplace_state_v1_original.sql').read_text()
# Retain the original checks, private/public projections and grants.
read=read.split('-- ACL at checkpoint:')[0]
state=state.split('-- ACL at checkpoint:')[0]
read=read.replace('SELECT l.id,l.created_at,','SELECT l.id,l.created_at,coalesce(l.published_at,l.created_at) publication_at,')
old="CASE WHEN p_filters->>'sort'='distance' THEN distance_km END ASC NULLS LAST,CASE WHEN p_filters->>'sort'='price_asc' THEN price END ASC,CASE WHEN p_filters->>'sort'='price_desc' THEN price END DESC,CASE WHEN p_filters->>'sort'='mileage_asc' THEN mileage END ASC,CASE WHEN p_filters->>'sort'='registration_desc' THEN registration END DESC NULLS LAST,created_at DESC,id"
order="""CASE WHEN p_filters->>'sort'='distance' THEN distance_km END ASC NULLS LAST,
 CASE WHEN p_filters->>'sort'='price_asc' THEN price END ASC NULLS LAST,
 CASE WHEN p_filters->>'sort'='price_desc' THEN price END DESC NULLS LAST,
 CASE WHEN p_filters->>'sort'='mileage_asc' THEN mileage END ASC NULLS LAST,
 CASE WHEN p_filters->>'sort'='mileage_desc' THEN mileage END DESC NULLS LAST,
 CASE WHEN p_filters->>'sort'='registration_asc' THEN registration END ASC NULLS LAST,
 CASE WHEN p_filters->>'sort'='registration_desc' THEN registration END DESC NULLS LAST,
 CASE WHEN p_filters->>'sort'='oldest' THEN publication_at END ASC NULLS LAST,
 publication_at DESC NULLS LAST,id"""
assert old in read
read=read.replace('page AS(SELECT * FROM matches ORDER BY '+old,'page AS(SELECT *,row_number() OVER(ORDER BY '+order+') sort_position FROM matches ORDER BY '+order)
read=read.replace("round(distance_km::numeric,1))) FROM page)","round(distance_km::numeric,1)) ORDER BY sort_position) FROM page)")
assert 'ORDER BY sort_position' in read
state=state.replace("CASE WHEN target='published' THEN now() ELSE published_at END","CASE WHEN target='published' THEN coalesce(published_at,now()) ELSE published_at END")
assert 'coalesce(published_at,now())' in state
path=root/'supabase/migrations/20261101120710_marketplace_ux_sorting_v1.sql'
path.write_text('-- Preserve original publication timestamps on future republication; deterministic public pagination. No record rewrites.\nBEGIN;\n'+read+'\n'+state+'\nCOMMIT;\n')
(evidence/'sorting_rollback.sql').write_text('BEGIN;\n'+(evidence/'luvipro_marketplace_read_v1_original.sql').read_text()+'\n'+(evidence/'luvipro_marketplace_state_v1_original.sql').read_text()+'\nCOMMIT;\n')
print(path)
