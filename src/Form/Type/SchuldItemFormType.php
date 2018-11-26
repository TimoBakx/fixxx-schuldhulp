<?php

namespace GemeenteAmsterdam\FixxxSchuldhulp\Form\Type;

use Doctrine\ORM\EntityManagerInterface;
use GemeenteAmsterdam\FixxxSchuldhulp\Entity\Schuldeiser;
use GemeenteAmsterdam\FixxxSchuldhulp\Entity\SchuldItem;
use GemeenteAmsterdam\FixxxSchuldhulp\Form\DataTransformer\IdToSchuldeiserTransformer;
use Psr\Log\LoggerInterface;
use Symfony\Bridge\Doctrine\Form\Type\EntityType;
use Symfony\Component\Form\AbstractType;
use Symfony\Component\Form\Extension\Core\Type\CheckboxType;
use Symfony\Component\Form\Extension\Core\Type\ChoiceType;
use Symfony\Component\Form\Extension\Core\Type\CollectionType;
use Symfony\Component\Form\Extension\Core\Type\DateType;
use Symfony\Component\Form\Extension\Core\Type\HiddenType;
use Symfony\Component\Form\Extension\Core\Type\NumberType;
use Symfony\Component\Form\Extension\Core\Type\TextType;
use Symfony\Component\Form\FormBuilderInterface;
use Symfony\Component\Form\FormEvent;
use Symfony\Component\Form\FormEvents;
use Symfony\Component\OptionsResolver\OptionsResolver;
use Symfony\Component\Validator\Constraints\Valid;

class SchuldItemFormType extends AbstractType
{

    private $logger;
    protected $em;
    /**
     * @var IdToSchuldeiserTransformer
     */
    private $idToSchuldeiserTransformer;

    public function __construct(EntityManagerInterface $em, LoggerInterface $logger, IdToSchuldeiserTransformer $idToSchuldeiserTransformer)
    {
        $this->em = $em;
        $this->logger = $logger;
        $this->idToSchuldeiserTransformer = $idToSchuldeiserTransformer;
    }

    public function buildForm(FormBuilderInterface $builder, array $options)
    {
        $factory = $builder->getFormFactory();

        $builder->add('verwijderd', CheckboxType::class, [
            'required' => false
        ]);
        $builder->add('schuldeiser', EntityType::class, [
            'required' => true,
            'class' => Schuldeiser::class,
            'choices' => [],
        ]);

        $builder->add('schuldeiser', HiddenType::class, [
            'invalid_message' => 'The selected schuldeiser cannot be found.',
        ])->addModelTransformer($this->idToSchuldeiserTransformer);

        $builder->add('incassant', EntityType::class, [
            'required' => false,
            'class' => Schuldeiser::class,
            'choice_attr' => function ($val, $key, $index) {
                /** @var $val Schuldeiser */
                return [
                    'data-bedrijfsnaam' => $val->getBedrijfsnaam(),
                    'data-rekening' => $val->getRekening(),
                    'data-allegro-code' => $val->getAllegroCode(),
                    'data-straat' => $val->getStraat(),
                    'data-huisnummer' => $val->getHuisnummer() . ' ' . $val->getHuisnummerToevoeging(),
                    'data-postcode' => $val->getPostcode(),
                    'data-plaats' => $val->getPlaats(),
                    'data-opmerkingen' => $val->getOpmerkingen(),
                ];
            },
        ]);
        $builder->add('referentie', TextType::class, [
            'required' => true
        ]);
        $builder->add('type', ChoiceType::class, [
            'required' => true,
            'choices' => SchuldItem::getTypes()
        ]);
        $builder->add('bedrag', NumberType::class, [
            'required' => true,
        ]);
        $builder->add('vastStelDatum', DateType::class, [
            'html5' => false,
            'attr' => ['data-decorator' => 'rome'],
            'format' => 'dd-MM-yyyy',
            'widget' => 'single_text',
            'label' => 'Contactdatum',
            'required' => true
        ]);
        $builder->add('ontstaansDatum', DateType::class, [
            'html5' => false,
            'attr' => ['data-decorator' => 'rome'],
            'format' => 'dd-MM-yyyy',
            'widget' => 'single_text',
            'label' => 'Ontstaansdatum',
            'required' => false
        ]);
        $builder->add('file', CollectionType::class, [
            'mapped' => false,
            'entry_type' => DocumentFormType::class,
            'entry_options' => ['required' => false],
            'allow_add' => true,
            'allow_delete' => true,
            'prototype_name' => '__name__',
            'by_reference' => false,
            'constraints' => [
                new Valid()
            ]
        ]);
        $builder->add('removeFile', CollectionType::class, [
            'mapped' => false,
            'entry_type' => HiddenType::class,
            'entry_options' => ['required' => false],
            'allow_add' => true,
            'prototype_name' => '__name__',
            'by_reference' => false,
        ]);
        $builder->add('aantekening', CreateAantekeningFormType::class, [
            'mapped' => false,
            'required' => false,
            'constraints' => [
                new Valid()
            ]
        ]);

        $builder->addEventListener(FormEvents::PRE_SUBMIT, function (FormEvent $event) {
            $data = $event->getData();
            unset($data['file']['__name__']);
            unset($data['removeFile']['__name__']);
            $form = $event->getForm();
            $em = $this->em;
            $form->add('schuldeiser', EntityType::class, [
                'required' => true,
                'class' => Schuldeiser::class,
                'query_builder' => function () use ($em) {
                    $repository = $em->getRepository(Schuldeiser::class);
                    $qb = $repository->createQueryBuilder('schuldeiser');
                    return $qb;
                },
            ]);

            $event->setData($data);


        });
    }

    public function configureOptions(OptionsResolver $resolver)
    {
        $resolver->setDefault('data_class', SchuldItem::class);
        $resolver->setDefault('choice_translation_domain', false);
    }
}
