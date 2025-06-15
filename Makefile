ACCOUNT_ID := $(shell aws sts get-caller-identity --query Account --output text)
AWS_REGION ?= $(shell aws configure get region)
REPOSITORY ?= mazy-video-tools-frontend
IMAGE_TAG  ?= latest
ECR_URI    := $(ACCOUNT_ID).dkr.ecr.$(AWS_REGION).amazonaws.com/$(REPOSITORY):$(IMAGE_TAG)

build:
	npm ci
	npm run build

docker-build:
	docker build -t $(REPOSITORY):$(IMAGE_TAG) .

push: docker-build
	aws ecr get-login-password --region $(AWS_REGION) \
	  | docker login --username AWS --password-stdin $(ACCOUNT_ID).dkr.ecr.$(AWS_REGION).amazonaws.com

	docker tag $(REPOSITORY):$(IMAGE_TAG) $(ECR_URI)

	docker push $(ECR_URI)