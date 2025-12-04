# How to reindex JAD

## rebuild the verticals

1. go to https://github.com/acdh-oeaw/noske-fcs/actions/workflows/dse-static.yml
1. run workflow dse-static (add name of project) `jad`
1. go for a coffee, or have some lunch

## publish new verticals

1. after successful rebuild of verticals
1. go to https://github.com/acdh-oeaw/noske-fcs/actions/workflows/build.yml and run build by clicking `run workflow`

## republish noske

1. go to https://github.com/acdh-oeaw/corpus-search/edit/main/Dockerfile
1. make a non breaking change
1. commit into main branch (use the web interface)
1. wait for it ... (start workflow to finish, now everything should be up to date)
